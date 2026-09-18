import { db } from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

const Collection = db.orm.public.Collection;
const Request = db.orm.public.Request;

const getNextPosition = async (collectionId, ownerId) => {
  const siblings = await Request
    .select('position')
    .where({ collectionId, ownerId })
    .orderBy((r) => r.position.desc())
    .limit(1)
    .all();

  if (siblings.length === 0) return 0;
  return siblings[0].position + 1;
};


export const createRequest = async (ownerId, collectionId, data) => {
 
  const collection = await Collection.where({ id: collectionId, ownerId }).first();
  if (!collection) {
    throw new ApiError(404, 'Collection not found.');
  }

  let position = data.position;
  if (position === undefined || position === null) {
    position = await getNextPosition(collectionId, ownerId);
  }

  const request = await Request.create({
    name: data.name,
    collectionId,
    ownerId,
    method: data.method || 'GET',
    url: data.url || '',
    headers: data.headers || null,
    body: data.body || null,
    position,
  });

  return request;
};


export const listRequests = async (ownerId, collectionId, { page = 1, limit = 20 }) => {
 
  const collection = await Collection.where({ id: collectionId, ownerId }).first();
  if (!collection) {
    throw new ApiError(404, 'Collection not found.');
  }

  page = Math.max(1, page);
  limit = Math.min(100, Math.max(1, limit));

  const skip = (page - 1) * limit;

  const [requests, countResult] = await Promise.all([
    Request
      .where({ collectionId, ownerId })
      .orderBy((r) => r.position.asc())
      .offset(skip)
      .limit(limit)
      .all(),
    Request
      .where({ collectionId, ownerId })
      .aggregate((agg) => ({ total: agg.count() })),
  ]);

  const total = Number(countResult.total);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};


export const getRequestById = async (ownerId, requestId) => {
  const request = await Request.where({ id: requestId, ownerId }).first();

  if (!request) {
    throw new ApiError(404, 'Request not found.');
  }

  return request;
};


export const updateRequest = async (ownerId, requestId, data) => {
  const request = await Request.where({ id: requestId, ownerId }).first();
  if (!request) {
    throw new ApiError(404, 'Request not found.');
  }

  
  const updatePayload = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.method !== undefined) updatePayload.method = data.method;
  if (data.url !== undefined) updatePayload.url = data.url;
  if (data.headers !== undefined) updatePayload.headers = data.headers;
  if (data.body !== undefined) updatePayload.body = data.body;
  if (data.position !== undefined) updatePayload.position = data.position;

  if (Object.keys(updatePayload).length === 0) {
    return request; // Nothing to update
  }

  const updated = await Request
    .where({ id: requestId, ownerId })
    .update(updatePayload);

  return updated[0];
};


export const deleteRequest = async (ownerId, requestId) => {
  const request = await Request.where({ id: requestId, ownerId }).first();
  if (!request) {
    throw new ApiError(404, 'Request not found.');
  }

  await Request.where({ id: requestId, ownerId }).delete();

  return { message: 'Request deleted successfully.' };
};
