import axiosClient from './axiosClient.js';

/**
 * POST /v1/execute — Execute an HTTP request via the proxy
 * @param {{ method: string, url: string, headers?: Record<string,string>, body?: string|null }} payload
 */
export const executeRequestApi = async ({ method, url, headers = {}, body = null }) => {
  const { data } = await axiosClient.post('/v1/execute', {
    method,
    url,
    headers,
    body,
  });
  return data;
};
