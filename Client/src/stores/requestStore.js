import { create } from 'zustand';
import { getRequestApi, updateRequestApi, deleteRequestApi } from '../api/requestApi.js';
import { executeRequestApi } from '../api/executeApi.js';

/**
 * Request editor + response store.
 *
 * Manages the currently active request being edited,
 * dirty tracking, and transient response state.
 */
const useRequestStore = create((set, get) => ({
  // ── Active request state ───────────────────────────────────
  activeRequest: null,    // The loaded/saved version from DB
  draft: null,            // The in-progress edit state
  isDirty: false,
  isLoading: false,
  isSaving: false,

  // ── Response state (transient, no persistence) ─────────────
  response: null,
  isExecuting: false,
  executeError: null,

  // ── Load a request for editing ─────────────────────────────
  loadRequest: async (requestId) => {
    set({ isLoading: true });
    try {
      const res = await getRequestApi(requestId);
      const request = res.data.request;

      // Parse headers from stored JSON string to array of {key,value}
      let headersArray = [];
      if (request.headers) {
        try {
          const parsed = JSON.parse(request.headers);
          headersArray = Object.entries(parsed).map(([key, value]) => ({
            key,
            value,
            enabled: true,
          }));
        } catch {
          headersArray = [];
        }
      }

      const draft = {
        id: request.id,
        name: request.name,
        collectionId: request.collectionId,
        method: request.method || 'GET',
        url: request.url || '',
        headers: headersArray.length > 0
          ? headersArray
          : [{ key: '', value: '', enabled: true }],
        body: request.body || '',
        params: parseQueryParams(request.url || ''),
      };

      set({
        activeRequest: request,
        draft,
        isDirty: false,
        isLoading: false,
        response: null,
        executeError: null,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Initialize a new unsaved request as draft ──────────────
  setDraftFromRequest: (request) => {
    let headersArray = [];
    if (request.headers) {
      try {
        const parsed = JSON.parse(request.headers);
        headersArray = Object.entries(parsed).map(([key, value]) => ({
          key,
          value,
          enabled: true,
        }));
      } catch {
        headersArray = [];
      }
    }

    const draft = {
      id: request.id,
      name: request.name,
      collectionId: request.collectionId,
      method: request.method || 'GET',
      url: request.url || '',
      headers: headersArray.length > 0
        ? headersArray
        : [{ key: '', value: '', enabled: true }],
      body: request.body || '',
      params: parseQueryParams(request.url || ''),
    };

    set({
      activeRequest: request,
      draft,
      isDirty: false,
      response: null,
      executeError: null,
    });
  },

  // ── Update a field in the draft ────────────────────────────
  updateDraft: (field, value) => {
    const { draft } = get();
    if (!draft) return;

    const updates = { [field]: value };

    // If URL changed, re-parse query params
    if (field === 'url') {
      updates.params = parseQueryParams(value);
    }

    // If params changed, rebuild URL
    if (field === 'params') {
      updates.url = rebuildUrl(draft.url, value);
    }

    set({
      draft: { ...draft, ...updates },
      isDirty: true,
    });
  },

  // ── Save draft to backend ──────────────────────────────────
  saveDraft: async () => {
    const { draft } = get();
    if (!draft?.id) return;

    set({ isSaving: true });
    try {
      // Convert headers array to JSON string for storage
      const headersObj = {};
      (draft.headers || []).forEach((h) => {
        if (h.enabled && h.key.trim()) {
          headersObj[h.key.trim()] = h.value;
        }
      });

      const payload = {
        name: draft.name,
        method: draft.method,
        url: draft.url,
        headers: Object.keys(headersObj).length > 0
          ? JSON.stringify(headersObj)
          : null,
        body: draft.body || null,
      };

      const res = await updateRequestApi(draft.id, payload);
      set({
        activeRequest: res.data.request,
        isDirty: false,
        isSaving: false,
      });

      return res.data.request;
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },

  // ── Delete active request ──────────────────────────────────
  deleteActiveRequest: async () => {
    const { draft } = get();
    if (!draft?.id) return;

    await deleteRequestApi(draft.id);
    set({
      activeRequest: null,
      draft: null,
      isDirty: false,
      response: null,
    });
  },

  // ── Execute the current draft ──────────────────────────────
  executeCurrentRequest: async () => {
    const { draft } = get();
    if (!draft?.url) return;

    set({ isExecuting: true, executeError: null, response: null });
    try {
      // Build headers object from enabled rows
      const headersObj = {};
      (draft.headers || []).forEach((h) => {
        if (h.enabled && h.key.trim()) {
          headersObj[h.key.trim()] = h.value;
        }
      });

      const res = await executeRequestApi({
        method: draft.method,
        url: draft.url,
        headers: headersObj,
        body: draft.body || null,
      });

      set({
        response: res.data.result,
        isExecuting: false,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Request failed.';
      set({
        executeError: message,
        isExecuting: false,
        response: {
          status: err.response?.status || 0,
          statusText: message,
          headers: {},
          body: err.response?.data ? JSON.stringify(err.response.data, null, 2) : message,
          responseTimeMs: 0,
          responseSizeBytes: 0,
        },
      });
    }
  },

  // ── Clear active request ───────────────────────────────────
  clearActiveRequest: () => {
    set({
      activeRequest: null,
      draft: null,
      isDirty: false,
      response: null,
      executeError: null,
    });
  },
}));

// ── URL / Query Param Helpers ────────────────────────────────

function parseQueryParams(url) {
  try {
    const urlObj = new URL(url);
    const params = [];
    urlObj.searchParams.forEach((value, key) => {
      params.push({ key, value, enabled: true });
    });
    if (params.length === 0) {
      params.push({ key: '', value: '', enabled: true });
    }
    return params;
  } catch {
    return [{ key: '', value: '', enabled: true }];
  }
}

function rebuildUrl(currentUrl, params) {
  try {
    const urlObj = new URL(currentUrl);
    // Clear existing params
    const existingKeys = [...urlObj.searchParams.keys()];
    existingKeys.forEach((k) => urlObj.searchParams.delete(k));

    // Add enabled params
    params.forEach((p) => {
      if (p.enabled && p.key.trim()) {
        urlObj.searchParams.set(p.key.trim(), p.value);
      }
    });

    return urlObj.toString();
  } catch {
    // If URL is invalid, return as-is
    return currentUrl;
  }
}

export default useRequestStore;
