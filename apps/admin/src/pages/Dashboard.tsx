import { useDashboardStats, useRecentCalls } from '../hooks/useSupabase';

function Dashboard() {
  const { totalLeads, callsToday, successRate, avgDuration, loading } = useDashboardStats();
  const { calls: recentCalls, loading: callsLoading } = useRecentCalls(5);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = [
    { label: 'Total Leads', value: loading ? '...' : totalLeads.toLocaleString(), change: '+12%', icon: '👥' },
    { label: 'Calls Today', value: loading ? '...' : callsToday.toString(), change: '+8%', icon: '📞' },
    { label: 'Success Rate', value: loading ? '...' : `${successRate}%`, change: '+5%', icon: '✅' },
    { label: 'Avg Duration', value: loading ? '...' : formatDuration(avgDuration), change: '-2%', icon: '⏱️' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'failed': return 'error';
      default: return 'pending';
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <button className="btn btn-primary">+ New Campaign</button>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card card ${loading ? 'loading' : ''}`}>
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
              <p className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {stat.change} from yesterday
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card recent-calls">
          <h3>Recent Calls</h3>
          {callsLoading ? (
            <div className="loading-skeleton">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          ) : recentCalls.length === 0 ? (
            <p className="no-data">No recent calls</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call.id}>
                    <td>{(call as any).lead?.name || 'Unknown'}</td>
                    <td>{(call as any).lead?.phone || '-'}</td>
                    <td>
                      <span className={`badge badge-${getStatusBadge(call.status)}`}>
                        {call.status}
                      </span>
                    </td>
                    <td>{call.duration ? formatDuration(call.duration) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card agent-status">
          <h3>AI Agent Status</h3>
          <div className="agent-info">
            <div className="agent-indicator online"></div>
            <div>
              <p className="agent-name">Main Agent</p>
              <p className="agent-subtitle">Online • Ready for calls</p>
            </div>
          </div>
          <div className="agent-stats">
            <div className="agent-stat">
              <span className="agent-stat-value">{callsToday}</span>
              <span className="agent-stat-label">Calls Today</span>
            </div>
            <div className="agent-stat">
              <span className="agent-stat-value">{successRate}%</span>
              <span className="agent-stat-label">Success</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          display: flex;
          gap: 1rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .stat-card.loading {
          opacity: 0.7;
        }
        
        .stat-icon {
          font-size: 2rem;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
        }
        
        .stat-change {
          font-size: 0.75rem;
        }
        
        .stat-change.positive { color: #10b981; }
        .stat-change.negative { color: #ef4444; }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }
        
        .recent-calls h3,
        .agent-status h3 {
          margin-bottom: 1rem;
          font-size: 1rem;
        }
        
        .agent-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        
        .agent-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .agent-indicator.online {
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .agent-name {
          font-weight: 600;
        }
        
        .agent-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .agent-stats {
          display: flex;
          gap: 1rem;
        }
        
        .agent-stat {
          flex: 1;
          background: var(--bg-input);
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
        }
        
        .agent-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .agent-stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .skeleton-row {
          height: 40px;
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
          color: var(--text-muted);
          text-align: center;
          padding: 2rem;
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
