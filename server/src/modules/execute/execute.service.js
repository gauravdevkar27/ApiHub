import ApiError from '../../utils/ApiError.js';

const TIMEOUT_MS = 10_000; // 10-second hard timeout


export const executeGetRequest = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  console.log("timer", timer);
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    });
    const body = await response.text();
   
    const responseTimeMs = Math.round(performance.now() - startTime);

    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      responseTimeMs,
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
