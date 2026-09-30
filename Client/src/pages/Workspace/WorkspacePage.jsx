import { useNavigate } from 'react-router-dom';
import { Panel, Group, Separator } from 'react-resizable-panels';
import useAuthStore from '../../stores/authStore.js';
import useRequestStore from '../../stores/requestStore.js';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';
import RequestEditor from '../../components/RequestEditor/RequestEditor.jsx';
import ResponseViewer from '../../components/ResponseViewer/ResponseViewer.jsx';
import './WorkspacePage.css';

const WorkspacePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const response = useRequestStore((s) => s.response);
  const isExecuting = useRequestStore((s) => s.isExecuting);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const showResponse = response || isExecuting;

  return (
    <div className="workspace">
      {/* ── Topbar ──────────────────────────────────────────── */}
      <header className="workspace__topbar">
        <div className="workspace__topbar-brand">
          <div className="workspace__topbar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="workspace__topbar-title">ApiHub</span>
        </div>

        <div className="workspace__topbar-actions">
          <div className="workspace__user-info">
            <div className="workspace__user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="workspace__user-name">{user?.name || 'User'}</span>
          </div>
          <button className="workspace__logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Main Content with Resizable Panels ────────────── */}
      <main className="workspace__main">
        <Group orientation="horizontal" id="workspace-h">
          {/* Sidebar panel */}
          <Panel
            defaultSize="18%"
            minSize="14%"
            maxSize="35%"
            className="workspace__panel"
            id="sidebar-panel"
          >
            <Sidebar />
          </Panel>

          <Separator className="workspace__resize-handle workspace__resize-handle--vertical" />

          {/* Main editor area */}
          <Panel minSize="40%" className="workspace__panel" id="editor-area-panel">
            {showResponse ? (
              <Group orientation="vertical" id="workspace-v">
                {/* Request editor */}
                <Panel
                  defaultSize="50%"
                  minSize="25%"
                  className="workspace__panel"
                  id="request-editor-panel"
                >
                  <RequestEditor />
                </Panel>

                <Separator className="workspace__resize-handle workspace__resize-handle--horizontal" />

                <Panel
                  defaultSize="50%"
                  minSize="15%"
                  className="workspace__panel"
                  id="response-viewer-panel"
                >
                  <ResponseViewer />
                </Panel>
              </Group>
            ) : (
              <RequestEditor />
            )}
          </Panel>
        </Group>
      </main>
    </div>
  );
};

export default WorkspacePage;
