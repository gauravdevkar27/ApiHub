import { fetch, Agent } from 'undici';
import ApiError from '../../utils/ApiError.js';
import { assertSafeUrl, safeLookup, isSsrfError } from './execute.guard.js';

const TIMEOUT_MS = 30_000;               // 30-second hard timeout (whole request incl. body)
const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB cap on what we read from the target

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Blocked headers that should never be forwarded from the client
 * to prevent security issues or interference with the proxy request.
 */
const BLOCKED_HEADERS = new Set([
  'host',
  'connection',
  'content-length', // recalculated by fetch
  'transfer-encoding',
  'keep-alive',
  'upgrade',
]);

/** Content types we are happy to return as text. Anything else is treated as binary. */
const TEXT_TYPE_PATTERN = /^text\/|json|xml|javascript|ecmascript|x-www-form-urlencoded|graphql|yaml|csv/i;

// One shared agent. Every connection it opens goes through safeLookup.
const dispatcher = new Agent({
  connect: { lookup: safeLookup, timeout: 10_000 },
});

const sanitizeHeaders = (headers) => {
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!BLOCKED_HEADERS.has(key.toLowerCase())) out[key] = value;
  }
  return out;
};

const omitHeaders = (headers, names) => {
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!names.includes(key.toLowerCase())) out[key] = value;
  }
  return out;
};

const hasHeader = (headers, name) =>
  Object.keys(headers).some((k) => k.toLowerCase() === name);

const looksLikeJson = (body) => {
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
};

/**
 * Read the response stream, stopping once the cap is reached so a huge
 * (or endless) response can never exhaust server memory.
 */
const readBodyWithLimit = async (response) => {
  if (!response.body) return { buffer: Buffer.alloc(0), truncated: false };

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (total + value.byteLength > MAX_RESPONSE_BYTES) {
      const remaining = MAX_RESPONSE_BYTES - total;
      if (remaining > 0) chunks.push(value.subarray(0, remaining));
      total = MAX_RESPONSE_BYTES;
      truncated = true;
      await reader.cancel();
      break;
    }

    chunks.push(value);
    total += value.byteLength;
  }

  return { buffer: Buffer.concat(chunks), truncated };
};

const isBinaryBody = (contentType, buffer) => {
  if (contentType) return !TEXT_TYPE_PATTERN.test(contentType);
  return buffer.subarray(0, 1024).includes(0); // no content-type → sniff for NUL bytes
};

/**
 * Execute an HTTP request as a proxy.
 *
 * @param {{ method: string, url: string, headers?: Record<string,string>, body?: string|null }} params
 * @returns {{ status, statusText, headers, body, bodyEncoding, contentType, truncated,
 *             redirectChain, responseTimeMs, responseSizeBytes }}
 */
export const executeRequest = async ({ method, url, headers = {}, body = null }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const startTime = performance.now();

  let currentUrl = url;
  let currentMethod = method.toUpperCase();
  let currentBody = METHODS_WITH_BODY.has(currentMethod) ? body : null;
  let currentHeaders = sanitizeHeaders(headers);
  const redirectChain = [];

  // If no Content-Type header was provided and body looks like JSON, set it
  if (currentBody && !hasHeader(currentHeaders, 'content-type') && looksLikeJson(currentBody)) {
    currentHeaders['Content-Type'] = 'application/json';
  }

  try {
    for (let hop = 0; ; hop++) {
      // Validate the URL on EVERY hop — a public URL can redirect to an internal one.
      assertSafeUrl(currentUrl);

      const response = await fetch(currentUrl, {
        method: currentMethod,
        headers: currentHeaders,
        body: currentBody ?? undefined,
        redirect: 'manual', // we follow redirects ourselves so each hop is checked
        signal: controller.signal,
        dispatcher,
      });

      const location = response.headers.get('location');

      if (REDIRECT_STATUSES.has(response.status) && location) {
        await response.body?.cancel();

        if (hop >= MAX_REDIRECTS) {
          throw new ApiError(502, `Too many redirects (max ${MAX_REDIRECTS}).`);
        }

        const nextUrl = new URL(location, currentUrl);

        // Never leak credentials to a different origin.
        if (nextUrl.origin !== new URL(currentUrl).origin) {
          currentHeaders = omitHeaders(currentHeaders, ['authorization', 'cookie']);
        }

        // Same method semantics browsers use: 303 (and 301/302 after POST) become GET.
        const switchToGet =
          response.status === 303 ||
          ((response.status === 301 || response.status === 302) && currentMethod === 'POST');

        if (switchToGet && currentMethod !== 'HEAD') {
          currentMethod = 'GET';
          currentBody = null;
          currentHeaders = omitHeaders(currentHeaders, ['content-type']);
        }

        currentUrl = nextUrl.toString();
        redirectChain.push(currentUrl);
        continue;
      }

      const { buffer, truncated } = await readBodyWithLimit(response);
      const responseTimeMs = Math.round(performance.now() - startTime);

      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = response.headers.get('content-type') || '';
      const isBinary = isBinaryBody(contentType, buffer);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: buffer.toString(isBinary ? 'base64' : 'utf8'),
        bodyEncoding: isBinary ? 'base64' : 'utf8',
        contentType,
        truncated,
        redirectChain,
        responseTimeMs,
        responseSizeBytes: buffer.length,
      };
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;

    if (isSsrfError(err)) {
      throw new ApiError(403, 'Requests to private or internal network addresses are blocked.');
    }

    if (err.name === 'AbortError') {
      throw new ApiError(504, `Request timed out after ${TIMEOUT_MS / 1000}s.`);
    }

    throw new ApiError(502, `Failed to reach the URL: ${err.cause?.message || err.message}`);
  } finally {
    clearTimeout(timer);
  }
};