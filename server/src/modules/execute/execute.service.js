import ApiError from '../../utils/ApiError.js';

const TIMEOUT_MS = 30_000; // 30-second hard timeout

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

/**
 * Execute an HTTP request as a proxy.
 *
 * @param {{ method: string, url: string, headers?: Record<string,string>, body?: string|null }} params
 * @returns {{ status, statusText, headers, body, responseTimeMs, responseSizeBytes }}
 */
export const executeRequest = async ({ method, url, headers = {}, body = null }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const startTime = performance.now();

  // Build fetch options
  const fetchOptions = {
    method: method.toUpperCase(),
    signal: controller.signal,
    redirect: 'follow',
  };

  // Forward custom headers (filter out blocked ones)
  const outgoingHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!BLOCKED_HEADERS.has(key.toLowerCase())) {
      outgoingHeaders[key] = value;
    }
  }

  if (Object.keys(outgoingHeaders).length > 0) {
    fetchOptions.headers = outgoingHeaders;
  }

  // Forward body for methods that support it
  const methodsWithBody = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  if (body && methodsWithBody.has(fetchOptions.method)) {
    fetchOptions.body = body;

    // If no Content-Type header was provided and body looks like JSON, set it
    const hasContentType = Object.keys(outgoingHeaders).some(
      (k) => k.toLowerCase() === 'content-type'
    );
    if (!hasContentType) {
      // Try to detect JSON
      try {
        JSON.parse(body);
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/json',
        };
      } catch {
        // Leave Content-Type unset — fetch will handle it
      }
    }
  }

  try {
    const response = await fetch(url, fetchOptions);
    const responseBody = await response.text();

    const responseTimeMs = Math.round(performance.now() - startTime);

    // Collect response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Calculate response size in bytes
    const responseSizeBytes = new TextEncoder().encode(responseBody).length;

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      responseTimeMs,
      responseSizeBytes,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError(504, `Request timed out after ${TIMEOUT_MS / 1000}s.`);
    }

    throw new ApiError(502, `Failed to reach the URL: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
};
