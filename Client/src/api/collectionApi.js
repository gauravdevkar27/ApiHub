import axiosClient from './axiosClient.js';

/**
 * GET /v1/collections — List root collections (paginated)
 */
export const listCollectionsApi = async ({ page = 1, limit = 50 } = {}) => {
  const { data } = await axiosClient.get('/v1/collections', {
    params: { page, limit },
  });
  return data;
};

/**
 * GET /v1/collections/:id — Get collection details (children + requests)
 */
export const getCollectionApi = async (collectionId) => {
  const { data } = await axiosClient.get(`/v1/collections/${collectionId}`);
  return data;
};

/**
 * POST /v1/collections — Create a new collection
 * @param {{ name: string, parentId?: string|null, position?: number }} payload
 */
export const createCollectionApi = async ({ name, parentId, position }) => {
  const { data } = await axiosClient.post('/v1/collections', {
    name,
    parentId: parentId || null,
    position,
  });
  return data;
};

/**
 * PATCH /v1/collections/:id — Update a collection
 * @param {string} collectionId
 * @param {{ name?: string, parentId?: string|null, position?: number }} payload
 */
export const updateCollectionApi = async (collectionId, payload) => {
  const { data } = await axiosClient.patch(`/v1/collections/${collectionId}`, payload);
  return data;
};

/**
 * DELETE /v1/collections/:id — Delete a collection (cascades)
 */
export const deleteCollectionApi = async (collectionId) => {
  const { data } = await axiosClient.delete(`/v1/collections/${collectionId}`);
  return data;
};
