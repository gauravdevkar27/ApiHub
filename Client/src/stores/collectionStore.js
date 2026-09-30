import { create } from 'zustand';
import {
  listCollectionsApi,
  getCollectionApi,
  createCollectionApi,
  updateCollectionApi,
  deleteCollectionApi,
} from '../api/collectionApi.js';
import {
  createRequestApi,
  deleteRequestApi,
} from '../api/requestApi.js';

/**
 * Collection tree store.
 *
 * Data shape for each node in `collections`:
 *   { id, name, parentId, position, childCount,
 *     children: [...],   ← populated lazily when expanded
 *     requests: [...],   ← populated lazily when expanded
 *     isExpanded: bool }
 */
const useCollectionStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────
  collections: [],        // root-level collection nodes
  isLoading: false,
  error: null,

  // ── Fetch root collections ─────────────────────────────────
  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await listCollectionsApi({ page: 1, limit: 100 });
      const roots = (response.data.collections || []).map((col) => ({
        ...col,
        children: [],
        requests: [],
        isExpanded: false,
      }));
      set({ collections: roots, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to fetch collections.',
        isLoading: false,
      });
    }
  },

  // ── Toggle expand / collapse a node ────────────────────────
  toggleExpand: async (collectionId) => {
    const { collections } = get();

    const toggleInTree = (nodes) =>
      nodes.map((node) => {
        if (node.id === collectionId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children?.length > 0) {
          return { ...node, children: toggleInTree(node.children) };
        }
        return node;
      });

    set({ collections: toggleInTree(collections) });

    // Fetch children + requests on first expand
    const node = findNode(collections, collectionId);
    if (node && !node.isExpanded && node.children.length === 0) {
      try {
        const response = await getCollectionApi(collectionId);
        const detail = response.data.collection;
        const children = (detail.children || []).map((c) => ({
          ...c,
          children: [],
          requests: [],
          isExpanded: false,
        }));
        const requests = detail.requests || [];

        set({
          collections: updateNodeInTree(get().collections, collectionId, {
            children,
            requests,
          }),
        });
      } catch {
        // Silently fail — node will show as empty
      }
    }
  },

  // ── Create collection ──────────────────────────────────────
  createCollection: async ({ name, parentId = null }) => {
    try {
      const response = await createCollectionApi({ name, parentId });
      const newCol = {
        ...response.data.collection,
        children: [],
        requests: [],
        isExpanded: false,
        childCount: 0,
      };

      if (!parentId) {
        set({ collections: [...get().collections, newCol] });
      } else {
        // Add as child of parent
        set({
          collections: updateNodeInTree(get().collections, parentId, (node) => ({
            children: [...node.children, newCol],
            childCount: (node.childCount || 0) + 1,
          })),
        });
      }

      return newCol;
    } catch (err) {
      throw err;
    }
  },

  // ── Rename collection ──────────────────────────────────────
  renameCollection: async (collectionId, name) => {
    try {
      await updateCollectionApi(collectionId, { name });
      set({
        collections: updateNodeInTree(get().collections, collectionId, { name }),
      });
    } catch (err) {
      throw err;
    }
  },

  // ── Delete collection ──────────────────────────────────────
  deleteCollection: async (collectionId) => {
    try {
      await deleteCollectionApi(collectionId);
      set({
        collections: removeNodeFromTree(get().collections, collectionId),
      });
    } catch (err) {
      throw err;
    }
  },

  // ── Add request inside a collection ────────────────────────
  addRequest: async (collectionId, { name = 'New Request' } = {}) => {
    try {
      const response = await createRequestApi(collectionId, { name });
      const newReq = response.data.request;

      set({
        collections: updateNodeInTree(get().collections, collectionId, (node) => ({
          requests: [...node.requests, newReq],
        })),
      });

      return newReq;
    } catch (err) {
      throw err;
    }
  },

  // ── Remove request from tree (after external delete) ───────
  removeRequestFromTree: (collectionId, requestId) => {
    set({
      collections: updateNodeInTree(get().collections, collectionId, (node) => ({
        requests: node.requests.filter((r) => r.id !== requestId),
      })),
    });
  },

  // ── Update request in tree (after external save) ───────────
  updateRequestInTree: (collectionId, requestId, updates) => {
    set({
      collections: updateNodeInTree(get().collections, collectionId, (node) => ({
        requests: node.requests.map((r) =>
          r.id === requestId ? { ...r, ...updates } : r
        ),
      })),
    });
  },
}));

// ── Tree Helpers ──────────────────────────────────────────────

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length > 0) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateNodeInTree(nodes, id, updater) {
  return nodes.map((node) => {
    if (node.id === id) {
      const updates = typeof updater === 'function' ? updater(node) : updater;
      return { ...node, ...updates };
    }
    if (node.children?.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, id, updater) };
    }
    return node;
  });
}

function removeNodeFromTree(nodes, id) {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children?.length > 0) {
        return { ...node, children: removeNodeFromTree(node.children, id) };
      }
      return node;
    });
}

export default useCollectionStore;
