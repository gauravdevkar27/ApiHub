import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import useRequestStore from '../../stores/requestStore.js';
import './ResponseViewer.css';

const ResponseViewer = () => {
  const response = useRequestStore((s) => s.response);
  const isExecuting = useRequestStore((s) => s.isExecuting);
  const executeError = useRequestStore((s) => s.executeError);

  const [activeTab, setActiveTab] = useState('body');
  const [prettyPrint, setPrettyPrint] = useState(true);

  // ── Derived values ──────────────────────────────────────────
  const statusCategory = useMemo(() => {
    if (!response) return null;
    const s = response.status;
    if (s >= 200 && s < 300) return 'success';
    if (s >= 300 && s < 400) return 'redirect';
    if (s >= 400 && s < 500) return 'client-error';
    if (s >= 500) return 'server-error';
    return 'unknown';
  }, [response]);

  const formattedBody = useMemo(() => {
    if (!response?.body) return '';
    if(response.bodyEncoding === 'base64') return '';
    if (!prettyPrint) return response.body;

    try {
      const parsed = JSON.parse(response.body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return response.body;
    }
  }, [response, prettyPrint]);

  const bodyLanguage = useMemo(() => {
    if (!response?.body) return 'plaintext';
    if(response.bodyEncoding === 'base64') return 'plaintext';
    const ct = response.headers?.['content-type'] || '';
    if (ct.includes('json')) return 'json';
    if (ct.includes('html')) return 'html';
    if (ct.includes('xml')) return 'xml';
    if (ct.includes('javascript')) return 'javascript';
    if (ct.includes('css')) return 'css';

    // Try to detect JSON
    try {
      JSON.parse(response.body);
      return 'json';
    } catch {
      return 'plaintext';
    }
  }, [response]);

  const responseHeaders = useMemo(() => {
    if (!response?.headers) return [];
    return Object.entries(response.headers).map(([key, value]) => ({ key, value }));
  }, [response]);

  const cookies = useMemo(() => {
    if (!response?.headers) return [];
    const cookieHeader = response.headers['set-cookie'];
    if (!cookieHeader) return [];
    return cookieHeader.split(',').map((c) => c.trim()).filter(Boolean);
  }, [response]);

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── No response yet ─────────────────────────────────────────
  if (!response && !isExecuting) {
    return (
      <div className="response-viewer response-viewer--empty">
        <div className="response-viewer__placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <p>Hit <strong>Send</strong> to see the response</p>
        </div>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────
  if (isExecuting) {
    return (
      <div className="response-viewer response-viewer--loading">
        <div className="response-viewer__loader">
          <div className="response-viewer__pulse-ring" />
          <span>Sending request…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="response-viewer">
      {/* ── Status bar ──────────────────────────────────────── */}
      <div className="response-viewer__status-bar">
        <div className="response-viewer__status-info">
          {/* Status badge */}
          <span
            className={`response-viewer__status-badge response-viewer__status-badge--${statusCategory}`}
          >
            {response.status} {response.statusText}
          </span>

          {/* Response time */}
          <span className="response-viewer__meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {response.responseTimeMs} ms
          </span>

          {/* Response size */}
          <span className="response-viewer__meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {formatSize(response.responseSizeBytes)}
          </span>
        </div>

        {/* Error indicator */}
        {executeError && (
          <span className="response-viewer__error-label">
            ⚠ {executeError}
          </span>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="response-viewer__tabs">
        <button
          className={`response-viewer__tab ${activeTab === 'body' ? 'response-viewer__tab--active' : ''
            }`}
          onClick={() => setActiveTab('body')}
        >
          Body
        </button>
        <button
          className={`response-viewer__tab ${activeTab === 'headers' ? 'response-viewer__tab--active' : ''
            }`}
          onClick={() => setActiveTab('headers')}
        >
          Headers
          {responseHeaders.length > 0 && (
            <span className="response-viewer__tab-count">
              {responseHeaders.length}
            </span>
          )}
        </button>
        <button
          className={`response-viewer__tab ${activeTab === 'cookies' ? 'response-viewer__tab--active' : ''
            }`}
          onClick={() => setActiveTab('cookies')}
        >
          Cookies
          {cookies.length > 0 && (
            <span className="response-viewer__tab-count">
              {cookies.length}
            </span>
          )}
        </button>

        {/* Pretty / Raw toggle (only for body tab) */}
        {activeTab === 'body' && (
          <div className="response-viewer__toggle">
            <button
              className={`response-viewer__toggle-btn ${prettyPrint ? 'response-viewer__toggle-btn--active' : ''
                }`}
              onClick={() => setPrettyPrint(true)}
            >
              Pretty
            </button>
            <button
              className={`response-viewer__toggle-btn ${!prettyPrint ? 'response-viewer__toggle-btn--active' : ''
                }`}
              onClick={() => setPrettyPrint(false)}
            >
              Raw
            </button>
          </div>
        )}
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <div className="response-viewer__content">
        {activeTab === 'body' && (
          <div className="response-viewer__body">
            {response.bodyEncoding === 'base64' ? (
              <div style={{ padding: 16 }}>
                <p>Binary response ({formatSize(response.responseSizeBytes)}, {response.contentType || 'unknown type'})</p>
                <a
                  href={`data:${response.contentType || 'application/octet-stream'};base64,${response.body}`}
                  download="response.bin"
                >
                  Download
                </a>
              </div>
            ) : (
              <>
                {response.truncated && (
                  <div style={{ padding: '4px 12px' }}>Response truncated at 5 MB.</div>
                )}
                <Editor
                  height="100%"
                  language={bodyLanguage}
                  theme="vs-dark"
                  value={formattedBody}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    renderLineHighlight: 'none',
                    tabSize: 2,
                    automaticLayout: true,
                    padding: { top: 8 },
                    domReadOnly: true,
                  }}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="response-viewer__headers-table">
            {responseHeaders.length === 0 ? (
              <div className="response-viewer__no-data">No headers</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {responseHeaders.map(({ key, value }, i) => (
                    <tr key={i}>
                      <td className="response-viewer__header-key">{key}</td>
                      <td className="response-viewer__header-value">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="response-viewer__cookies">
            {cookies.length === 0 ? (
              <div className="response-viewer__no-data">No cookies in this response</div>
            ) : (
              <div className="response-viewer__cookie-list">
                {cookies.map((cookie, i) => (
                  <div key={i} className="response-viewer__cookie-item">
                    <code>{cookie}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;
