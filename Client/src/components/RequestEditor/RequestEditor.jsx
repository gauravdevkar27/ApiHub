import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import useRequestStore from '../../stores/requestStore.js';
import useCollectionStore from '../../stores/collectionStore.js';
import './RequestEditor.css';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_COLORS = {
  GET: 'var(--method-get)',
  POST: 'var(--method-post)',
  PUT: 'var(--method-put)',
  PATCH: 'var(--method-patch)',
  DELETE: 'var(--method-delete)',
};

const RequestEditor = () => {
  const draft = useRequestStore((s) => s.draft);
  const isDirty = useRequestStore((s) => s.isDirty);
  const isSaving = useRequestStore((s) => s.isSaving);
  const isExecuting = useRequestStore((s) => s.isExecuting);
  const isLoading = useRequestStore((s) => s.isLoading);
  const updateDraft = useRequestStore((s) => s.updateDraft);
  const saveDraft = useRequestStore((s) => s.saveDraft);
  const executeCurrentRequest = useRequestStore((s) => s.executeCurrentRequest);
  const deleteActiveRequest = useRequestStore((s) => s.deleteActiveRequest);
  const clearActiveRequest = useRequestStore((s) => s.clearActiveRequest);
  const removeRequestFromTree = useCollectionStore((s) => s.removeRequestFromTree);
  const updateRequestInTree = useCollectionStore((s) => s.updateRequestInTree);

  const [activeTab, setActiveTab] = useState('params');
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);

  const handleSend = useCallback(async () => {
    if (!draft?.url?.trim()) return;
    // Auto-save before sending
    if (isDirty) {
      try {
        const saved = await saveDraft();
        if (saved && draft.collectionId) {
          updateRequestInTree(draft.collectionId, draft.id, {
            name: draft.name,
            method: draft.method,
            url: draft.url,
          });
        }
      } catch {
        // continue to execute even if save fails
      }
    }
    await executeCurrentRequest();
  }, [draft, isDirty, saveDraft, executeCurrentRequest, updateRequestInTree]);

  const handleSave = useCallback(async () => {
    try {
      const saved = await saveDraft();
      if (saved && draft.collectionId) {
        updateRequestInTree(draft.collectionId, draft.id, {
          name: draft.name,
          method: draft.method,
          url: draft.url,
        });
      }
    } catch {
      // handled
    }
  }, [saveDraft, draft, updateRequestInTree]);

  const handleDelete = useCallback(async () => {
    if (!draft) return;
    if (!window.confirm(`Delete "${draft.name}"?`)) return;
    const collectionId = draft.collectionId;
    const requestId = draft.id;
    await deleteActiveRequest();
    removeRequestFromTree(collectionId, requestId);
  }, [draft, deleteActiveRequest, removeRequestFromTree]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSave, handleSend]
  );

  if (isLoading) {
    return (
      <div className="req-editor req-editor--loading">
        <div className="req-editor__loader">
          <div className="req-editor__spinner" />
          Loading request…
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="req-editor req-editor--empty">
        <div className="req-editor__empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <h3>No Request Selected</h3>
          <p>Select a request from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="req-editor" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* ── Request Name ───────────────────────────────────── */}
      <div className="req-editor__name-bar">
        <input
          className="req-editor__name-input"
          type="text"
          value={draft.name}
          onChange={(e) => updateDraft('name', e.target.value)}
          placeholder="Request name…"
        />
        <div className="req-editor__name-actions">
          {isDirty && (
            <span className="req-editor__dirty-badge">Unsaved</span>
          )}
          <button
            className="req-editor__save-btn"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            title="Save (Ctrl+S)"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            className="req-editor__delete-btn"
            onClick={handleDelete}
            title="Delete request"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── URL Bar ────────────────────────────────────────── */}
      <div className="req-editor__url-bar">
        {/* Method dropdown */}
        <div className="req-editor__method-wrapper">
          <button
            className="req-editor__method-btn"
            style={{ color: METHOD_COLORS[draft.method] }}
            onClick={() => setShowMethodDropdown(!showMethodDropdown)}
          >
            {draft.method}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showMethodDropdown && (
            <div className="req-editor__method-dropdown">
              {METHODS.map((m) => (
                <button
                  key={m}
                  className={`req-editor__method-option ${
                    draft.method === m ? 'req-editor__method-option--active' : ''
                  }`}
                  style={{ color: METHOD_COLORS[m] }}
                  onClick={() => {
                    updateDraft('method', m);
                    setShowMethodDropdown(false);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* URL input */}
        <input
          className="req-editor__url-input"
          type="text"
          value={draft.url}
          onChange={(e) => updateDraft('url', e.target.value)}
          placeholder="Enter request URL…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />

        {/* Send button */}
        <button
          className="req-editor__send-btn"
          onClick={handleSend}
          disabled={isExecuting || !draft.url?.trim()}
          title="Send (Ctrl+Enter)"
        >
          {isExecuting ? (
            <>
              <div className="req-editor__send-spinner" />
              Sending
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
            </>
          )}
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="req-editor__tabs">
        {['params', 'headers', 'body'].map((tab) => (
          <button
            key={tab}
            className={`req-editor__tab ${
              activeTab === tab ? 'req-editor__tab--active' : ''
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'headers' && draft.headers.filter((h) => h.key.trim()).length > 0 && (
              <span className="req-editor__tab-count">
                {draft.headers.filter((h) => h.key.trim()).length}
              </span>
            )}
            {tab === 'params' && draft.params.filter((p) => p.key.trim()).length > 0 && (
              <span className="req-editor__tab-count">
                {draft.params.filter((p) => p.key.trim()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────── */}
      <div className="req-editor__tab-content">
        {activeTab === 'params' && (
          <KeyValueTable
            rows={draft.params}
            onChange={(params) => updateDraft('params', params)}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === 'headers' && (
          <KeyValueTable
            rows={draft.headers}
            onChange={(headers) => updateDraft('headers', headers)}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === 'body' && (
          <div className="req-editor__body-editor">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={draft.body || ''}
              onChange={(value) => updateDraft('body', value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 8 },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Reusable Key-Value Table ────────────────────────────────

const KeyValueTable = ({ rows, onChange, keyPlaceholder, valuePlaceholder }) => {
  const updateRow = (index, field, value) => {
    const updated = rows.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    );
    onChange(updated);
  };

  const toggleRow = (index) => {
    const updated = rows.map((r, i) =>
      i === index ? { ...r, enabled: !r.enabled } : r
    );
    onChange(updated);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) {
      onChange([{ key: '', value: '', enabled: true }]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { key: '', value: '', enabled: true }]);
  };

  return (
    <div className="kv-table">
      <div className="kv-table__header">
        <div className="kv-table__col-check" />
        <div className="kv-table__col-key">{keyPlaceholder}</div>
        <div className="kv-table__col-value">{valuePlaceholder}</div>
        <div className="kv-table__col-action" />
      </div>
      <div className="kv-table__body">
        {rows.map((row, index) => (
          <div
            key={index}
            className={`kv-table__row ${!row.enabled ? 'kv-table__row--disabled' : ''}`}
          >
            <div className="kv-table__col-check">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={() => toggleRow(index)}
                className="kv-table__checkbox"
              />
            </div>
            <div className="kv-table__col-key">
              <input
                type="text"
                value={row.key}
                onChange={(e) => updateRow(index, 'key', e.target.value)}
                placeholder={keyPlaceholder}
                className="kv-table__input"
              />
            </div>
            <div className="kv-table__col-value">
              <input
                type="text"
                value={row.value}
                onChange={(e) => updateRow(index, 'value', e.target.value)}
                placeholder={valuePlaceholder}
                className="kv-table__input"
              />
            </div>
            <div className="kv-table__col-action">
              <button
                className="kv-table__remove-btn"
                onClick={() => removeRow(index)}
                title="Remove row"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="kv-table__add-btn" onClick={addRow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Row
      </button>
    </div>
  );
};

export default RequestEditor;
