import { useEffect, useState, useRef } from 'react';
import useCollectionStore from '../../stores/collectionStore.js';
import useRequestStore from '../../stores/requestStore.js';
import './Sidebar.css';

const METHOD_COLORS = {
  GET: 'var(--method-get)',
  POST: 'var(--method-post)',
  PUT: 'var(--method-put)',
  PATCH: 'var(--method-patch)',
  DELETE: 'var(--method-delete)',
  HEAD: 'var(--text-secondary)',
  OPTIONS: 'var(--text-secondary)',
};

const Sidebar = () => {
  const {
    collections,
    isLoading,
    fetchCollections,
    toggleExpand,
    createCollection,
    renameCollection,
    deleteCollection,
    addRequest,
  } = useCollectionStore();

  const loadRequest = useRequestStore((s) => s.loadRequest);
  const activeRequest = useRequestStore((s) => s.draft);

  const [showNewInput, setShowNewInput] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionParentId, setNewCollectionParentId] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      await createCollection({
        name: newCollectionName.trim(),
        parentId: newCollectionParentId,
      });
      setNewCollectionName('');
      setShowNewInput(false);
      setNewCollectionParentId(null);
    } catch {
      // Error handled by store
    }
  };

  const handleAddSubCollection = (parentId) => {
    setNewCollectionParentId(parentId);
    setNewCollectionName('');
    setShowNewInput(true);
  };

  const handleAddRootCollection = () => {
    setNewCollectionParentId(null);
    setNewCollectionName('');
    setShowNewInput(true);
  };

  return (
    <div className="sidebar">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="sidebar__header">
        <span className="sidebar__title">Collections</span>
        <button
          className="sidebar__add-btn"
          onClick={handleAddRootCollection}
          title="New Collection"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* ── New collection input ───────────────────────────── */}
      {showNewInput && !newCollectionParentId && (
        <form className="sidebar__new-form" onSubmit={handleCreateCollection}>
          <input
            className="sidebar__new-input"
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Collection name…"
            autoFocus
            onBlur={() => {
              if (!newCollectionName.trim()) {
                setShowNewInput(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowNewInput(false);
              }
            }}
          />
        </form>
      )}

      {/* ── Tree ───────────────────────────────────────────── */}
      <div className="sidebar__tree">
        {isLoading && collections.length === 0 ? (
          <div className="sidebar__loading">
            <div className="sidebar__skeleton" />
            <div className="sidebar__skeleton" />
            <div className="sidebar__skeleton" />
          </div>
        ) : collections.length === 0 ? (
          <div className="sidebar__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sidebar__empty-icon">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <p>No collections yet</p>
            <button className="sidebar__empty-btn" onClick={handleAddRootCollection}>
              Create your first collection
            </button>
          </div>
        ) : (
          collections.map((node) => (
            <CollectionNode
              key={node.id}
              node={node}
              depth={0}
              onToggle={toggleExpand}
              onRename={renameCollection}
              onDelete={deleteCollection}
              onAddSub={handleAddSubCollection}
              onAddRequest={addRequest}
              onSelectRequest={loadRequest}
              activeRequestId={activeRequest?.id}
              newCollectionInput={
                showNewInput && newCollectionParentId === node.id
                  ? {
                      name: newCollectionName,
                      setName: setNewCollectionName,
                      onSubmit: handleCreateCollection,
                      onCancel: () => setShowNewInput(false),
                    }
                  : null
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

// ── Collection Node (recursive) ──────────────────────────────

const CollectionNode = ({
  node,
  depth,
  onToggle,
  onRename,
  onDelete,
  onAddSub,
  onAddRequest,
  onSelectRequest,
  activeRequestId,
  newCollectionInput,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleRenameSubmit = async () => {
    if (renameValue.trim() && renameValue.trim() !== node.name) {
      try {
        await onRename(node.id, renameValue.trim());
      } catch {
        setRenameValue(node.name);
      }
    } else {
      setRenameValue(node.name);
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (window.confirm(`Delete "${node.name}" and all its contents?`)) {
      try {
        await onDelete(node.id);
      } catch {
        // handled
      }
    }
  };

  const handleAddRequest = async () => {
    setShowMenu(false);
    try {
      const newReq = await onAddRequest(node.id);
      if (newReq) {
        onSelectRequest(newReq.id);
      }
      // Auto-expand if collapsed
      if (!node.isExpanded) {
        onToggle(node.id);
      }
    } catch {
      // handled
    }
  };

  const paddingLeft = 12 + depth * 16;

  return (
    <div className="sidebar__node">
      {/* Collection row */}
      <div
        className="sidebar__node-row"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <button
          className="sidebar__chevron"
          onClick={() => onToggle(node.id)}
          data-expanded={node.isExpanded}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {isRenaming ? (
          <input
            className="sidebar__rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setRenameValue(node.name);
                setIsRenaming(false);
              }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="sidebar__node-name truncate"
            onDoubleClick={() => {
              setRenameValue(node.name);
              setIsRenaming(true);
            }}
            onClick={() => onToggle(node.id)}
          >
            <svg className="sidebar__folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {node.isExpanded ? (
                <path d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h9a2 2 0 012 2v1M5 19h14a2 2 0 002-2l-3-8H6a2 2 0 00-2 2l-1 6a2 2 0 002 2z" />
              ) : (
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              )}
            </svg>
            {node.name}
            {node.childCount > 0 && (
              <span className="sidebar__count">{node.childCount}</span>
            )}
          </span>
        )}

        {/* Context menu trigger */}
        <div className="sidebar__node-actions" ref={menuRef}>
          <button
            className="sidebar__menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <div className="sidebar__context-menu">
              <button onClick={handleAddRequest}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Request
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onAddSub(node.id);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                New Subfolder
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setRenameValue(node.name);
                  setIsRenaming(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Rename
              </button>
              <div className="sidebar__menu-divider" />
              <button className="sidebar__menu-danger" onClick={handleDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New sub-collection input */}
      {newCollectionInput && (
        <form
          className="sidebar__new-form"
          style={{ paddingLeft: `${paddingLeft + 24}px` }}
          onSubmit={newCollectionInput.onSubmit}
        >
          <input
            className="sidebar__new-input"
            type="text"
            value={newCollectionInput.name}
            onChange={(e) => newCollectionInput.setName(e.target.value)}
            placeholder="Subfolder name…"
            autoFocus
            onBlur={() => {
              if (!newCollectionInput.name.trim()) {
                newCollectionInput.onCancel();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') newCollectionInput.onCancel();
            }}
          />
        </form>
      )}

      {/* Children + requests (when expanded) */}
      {node.isExpanded && (
        <div className="sidebar__children">
          {/* Sub-collections */}
          {node.children.map((child) => (
            <CollectionNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={useCollectionStore.getState().toggleExpand}
              onRename={useCollectionStore.getState().renameCollection}
              onDelete={useCollectionStore.getState().deleteCollection}
              onAddSub={onAddSub}
              onAddRequest={useCollectionStore.getState().addRequest}
              onSelectRequest={onSelectRequest}
              activeRequestId={activeRequestId}
              newCollectionInput={null}
            />
          ))}

          {/* Requests */}
          {node.requests.map((req) => (
            <div
              key={req.id}
              className={`sidebar__request-row ${
                activeRequestId === req.id ? 'sidebar__request-row--active' : ''
              }`}
              style={{ paddingLeft: `${paddingLeft + 28}px` }}
              onClick={() => onSelectRequest(req.id)}
            >
              <span
                className="sidebar__method-badge"
                style={{ color: METHOD_COLORS[req.method] || 'var(--text-secondary)' }}
              >
                {req.method}
              </span>
              <span className="sidebar__request-name truncate">{req.name}</span>
            </div>
          ))}

          {/* Empty state */}
          {node.children.length === 0 && node.requests.length === 0 && (
            <div
              className="sidebar__empty-folder"
              style={{ paddingLeft: `${paddingLeft + 28}px` }}
            >
              Empty — add a request or subfolder
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
