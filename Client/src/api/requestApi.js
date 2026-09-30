import axiosClient from './axiosClient.js';

/**
 * POST /v1/collections/:collectionId/requests — Create a new request
 * @param {string} collectionId
 * @param {{ name: string, method?: string, url?: string, headers?: string, body?: string, position?: number }} payload
 */
export const createRequestApi = async (collectionId, payload) => {
  const { data } = await axiosClient.post(
    `/v1/collections/${collectionId}/requests`,
    payload
  );
  return data;
};

/**
 * GET /v1/collections/:collectionId/requests — List requests in a collection
 */
export const listRequestsApi = async (collectionId, { page = 1, limit = 50 } = {}) => {
  const { data } = await axiosClient.get(
    `/v1/collections/${collectionId}/requests`,
    { params: { page, limit } }
  );
  return data;
};

/**
 * GET /v1/requests/:id — Get a single request
 */
export const getRequestApi = async (requestId) => {
  const { data } = await axiosClient.get(`/v1/requests/${requestId}`);
  return data;
};

/**
 * PATCH /v1/requests/:id — Update a request
 */
export const updateRequestApi = async (requestId, payload) => {
  const { data } = await axiosClient.patch(`/v1/requests/${requestId}`, payload);
  return data;
};

/**
 * DELETE /v1/requests/:id — Delete a request
 */
export const deleteRequestApi = async (requestId) => {
  const { data } = await axiosClient.delete(`/v1/requests/${requestId}`);
  return data;
};
