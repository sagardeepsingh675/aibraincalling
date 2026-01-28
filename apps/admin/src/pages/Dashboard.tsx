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
    { label: 'Total Leads', value: loading ? '...' : totalLeads.toLocaleString(), icon: '👥' },
    { label: 'Calls Today', value: loading ? '...' : callsToday.toString(), icon: '📞' },
    { label: 'Success Rate', value: loading ? '...' : `${successRate}%`, icon: '✅' },
    { label: 'Avg Duration', value: loading ? '...' : formatDuration(avgDuration), icon: '⏱️' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-warning';
      case 'failed': return 'badge-error';
      default: return 'badge-pending';
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Overview of your calling operations</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card card ${loading ? 'loading' : ''}`}>
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card recent-calls">
          <div className="card-header">
            <h3 className="card-title">Recent Calls</h3>
          </div>
          {callsLoading ? (
            <div className="loading-skeleton">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          ) : recentCalls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📞</div>
              <div className="empty-state-title">No Calls Yet</div>
              <div className="empty-state-text">Recent call activity will appear here</div>
            </div>
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
                    <td><code>{(call as any).lead?.phone || '-'}</code></td>
                    <td>
                      <span className={`badge ${getStatusBadge(call.status)}`}>
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
          <div className="card-header">
            <h3 className="card-title">AI Agent Status</h3>
          </div>
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
    </div>
  );
}

export default Dashboard;
