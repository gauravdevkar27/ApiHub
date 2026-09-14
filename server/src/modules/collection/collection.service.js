import { db } from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

const Collection = db.orm.public.Collection;
const Request = db.orm.public.Request;

const getNextPosition = async (ownerId, parentId = null) => {
  const siblings = await Collection
    .select('position')
    .where({ ownerId, parentId: parentId ?? null })
    .orderBy((c) => c.position.desc())
    .limit(1)
    .all();

  if (siblings.length === 0) return 0;
  return siblings[0].position + 1;
};

const wouldCreateCycle = async (targetId, startId, ownerId) => {
  let currentId = startId;

  while (currentId) {
    if (currentId === targetId) return true;

    const parent = await Collection
      .select('parentId')
      .where({ id: currentId, ownerId })
      .first();

    if (!parent) break;
    currentId = parent.parentId;
  }

  return false;
};


const collectDescendantIds = async (collectionId, ownerId) => {
  const ids = [];
  const children = await Collection
    .select('id')
    .where({ ownerId, parentId: collectionId })
    .all();

  for (const child of children) {
    ids.push(child.id);
    const grandchildIds = await collectDescendantIds(child.id, ownerId);
    ids.push(...grandchildIds);
  }

  return ids;
};


export const createCollection = async (ownerId, { name, parentId, position }) => {
  // If parentId provided, verify it exists and belongs to this user
  if (parentId) {
    const parent = await Collection.where({ id: parentId, ownerId }).first();
    if (!parent) {
      throw new ApiError(404, 'Parent collection not found.');
    }
  }

  if (position === undefined || position === null) {
    position = await getNextPosition(ownerId, parentId || null);
  }

  const collection = await Collection.create({
    name,
    ownerId,
    parentId: parentId || null,
    position,
  });

  return collection;
};


export const listCollections = async (ownerId, { page = 1, limit = 20 }) => {
  page = Math.max(1, page);
  limit = Math.min(100, Math.max(1, limit));

  const skip = (page - 1) * limit;

  const [collections, countResult] = await Promise.all([
    Collection
      .where({ ownerId, parentId: null })
      .orderBy((c) => c.position.asc())
      .offset(skip)
      .limit(limit)
      .all(),
    Collection
      .where({ ownerId, parentId: null })
      .aggregate((agg) => ({ total: agg.count() })),
  ]);

  const total = Number(countResult.total);

  const collectionsWithMeta = await Promise.all(
    collections.map(async (col) => {
      const childCountResult = await Collection
        .where({ ownerId, parentId: col.id })
        .aggregate((agg) => ({ count: agg.count() }));
      return {
        ...col,
        childCount: Number(childCountResult.count),
      };
    })
  );

  return {
    collections: collectionsWithMeta,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
export const getCollectionById = async (ownerId, collectionId) => {
  const collection = await Collection.where({ id: collectionId, ownerId }).first();

  if (!collection) {
    throw new ApiError(404, 'Collection not found.');
  }

  const children = await Collection
    .where({ ownerId, parentId: collectionId })
    .orderBy((c) => c.position.asc())
    .all();

  const childrenWithMeta = await Promise.all(
    children.map(async (child) => {
      const childCountResult = await Collection
        .where({ ownerId, parentId: child.id })
        .aggregate((agg) => ({ count: agg.count() }));
      return {
        ...child,
        childCount: Number(childCountResult.count),
      };
    })
  );

  const requests = await Request
    .where({ collectionId, ownerId })
    .orderBy((r) => r.position.asc())
    .all();

  return {
    ...collection,
    children: childrenWithMeta,
    requests,
  };
};


export const updateCollection = async (ownerId, collectionId, data) => {
  const collection = await Collection.where({ id: collectionId, ownerId }).first();
  if (!collection) {
    throw new ApiError(404, 'Collection not found.');
  }

  if (data.parentId !== undefined) {
    const newParentId = data.parentId;

    // Can't parent to self
    if (newParentId === collectionId) {
      throw new ApiError(400, 'A collection cannot be its own parent.');
    }

    // If setting a parent (not moving to root), verify it exists and check cycles
    if (newParentId !== null) {
      const newParent = await Collection.where({ id: newParentId, ownerId }).first();
      if (!newParent) {
        throw new ApiError(404, 'Target parent collection not found.');
      }

      // Cycle detection: walk up from newParentId, if we find collectionId → cycle
      const hasCycle = await wouldCreateCycle(collectionId, newParentId, ownerId);
      if (hasCycle) {
        throw new ApiError(400, 'Cannot move a collection into its own descendant.');
      }
    }
  }

  // Build update payload — only include fields that were provided
  const updatePayload = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.parentId !== undefined) updatePayload.parentId = data.parentId;
  if (data.position !== undefined) updatePayload.position = data.position;

  if (Object.keys(updatePayload).length === 0) {
    return collection; // Nothing to update
  }

  const updated = await Collection
    .where({ id: collectionId, ownerId })
    .update(updatePayload);

  return updated[0];
};

/**
 * Delete a collection and cascade to all descendants + their requests.
 */
export const deleteCollection = async (ownerId, collectionId) => {
  const collection = await Collection.where({ id: collectionId, ownerId }).first();
  if (!collection) {
    throw new ApiError(404, 'Collection not found.');
  }

  // Collect all descendant IDs (recursive)
  const descendantIds = await collectDescendantIds(collectionId, ownerId);
  const allCollectionIds = [collectionId, ...descendantIds];

  // Delete all requests in all affected collections
  for (const colId of allCollectionIds) {
    await Request.where({ collectionId: colId, ownerId }).delete();
  }

  // Delete collections bottom-up (descendants first, then the target)
  for (const descId of descendantIds.reverse()) {
    await Collection.where({ id: descId, ownerId }).delete();
  }

  // Finally delete the target collection
  await Collection.where({ id: collectionId, ownerId }).delete();

  return { message: 'Collection deleted successfully.' };
};
