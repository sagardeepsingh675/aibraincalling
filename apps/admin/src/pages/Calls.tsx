import { useState } from 'react';
import { useCalls, useCallLogs } from '../hooks/useSupabase';

function Calls() {
  const { calls, loading, fetchCalls } = useCalls();
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const { logs, loading: logsLoading } = useCallLogs(selectedCall);

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchCalls({ status: status || undefined });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': case 'ringing': return 'warning';
      case 'failed': return 'error';
      default: return 'pending';
    }
  };

  return (
    <div className="calls-page">
      <div className="page-header">
        <h1 className="page-title">Call History</h1>
        <div className="header-actions">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>
        </div>
      </div>

      <div className="calls-grid">
        <div className="card calls-list">
          {loading ? (
            <div className="loading-skeleton">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          ) : calls.length === 0 ? (
            <div className="no-data">No calls found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Phone</th>
                  <th>Date/Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr
                    key={call.id}
                    className={selectedCall === call.id ? 'selected' : ''}
                    onClick={() => setSelectedCall(call.id)}
                  >
                    <td>{(call as any).lead?.name || 'Unknown'}</td>
                    <td>{(call as any).lead?.phone || '-'}</td>
                    <td>{formatDateTime(call.started_at || call.created_at)}</td>
                    <td>{formatDuration(call.duration)}</td>
                    <td>
                      <span className={`badge badge-${getStatusBadge(call.status)}`}>
                        {call.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCall(call.id);
                        }}
                        title="View Transcript"
                      >
                        📝
                      </button>
                      <button className="btn-icon" title="Play Recording">▶️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Transcript Panel */}
        <div className="card transcript-panel">
          <h3>Call Transcript</h3>
          {!selectedCall ? (
            <div className="no-data">Select a call to view transcript</div>
          ) : logsLoading ? (
            <div className="loading-skeleton">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="no-data">No transcript available</div>
          ) : (
            <div className="transcript-messages">
              {logs.map((log) => (
                <div key={log.id} className={`message message-${log.speaker}`}>
                  <span className="message-speaker">
                    {log.speaker === 'agent' ? '🤖 AI' : log.speaker === 'user' ? '👤 User' : '⚙️ System'}
                  </span>
                  <p className="message-text">{log.message}</p>
                  <span className="message-time">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .header-actions {
          display: flex;
          gap: 0.75rem;
        }
        
        .filter-select {
          padding: 0.625rem 1rem;
          background: var(--bg-input);
          border: none;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        
        .calls-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 1.5rem;
        }
        
        .calls-list {
          overflow: hidden;
        }
        
        .table tbody tr {
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .table tbody tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .table tbody tr.selected {
          background: rgba(99, 102, 241, 0.15);
        }
        
        .btn-icon {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 1rem;
          opacity: 0.6;
          transition: opacity 150ms ease;
        }
        
        .btn-icon:hover {
          opacity: 1;
        }
        
        .transcript-panel {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }
        
        .transcript-panel h3 {
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        
        .transcript-messages {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .message {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          animation: fadeInUp 0.3s ease;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message-agent {
          background: rgba(99, 102, 241, 0.15);
          margin-right: 1rem;
        }
        
        .message-user {
          background: rgba(16, 185, 129, 0.15);
          margin-left: 1rem;
        }
        
        .message-system {
          background: rgba(245, 158, 11, 0.15);
          font-size: 0.75rem;
          text-align: center;
        }
        
        .message-speaker {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        
        .message-text {
          margin: 0.25rem 0;
        }
        
        .message-time {
          font-size: 0.625rem;
          color: var(--text-muted);
        }
        
        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .skeleton-row {
          height: 50px;
          background: linear-gradient(90deg, var(--bg-input) 25%, var(--bg-card) 50%, var(--bg-input) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .no-data {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
        }
        
        @media (max-width: 1024px) {
          .calls-grid {
            grid-template-columns: 1fr;
          }
          
          .transcript-panel {
            max-height: 400px;
          }
        }
      `}</style>
    </div>
  );
}

export default Calls;
