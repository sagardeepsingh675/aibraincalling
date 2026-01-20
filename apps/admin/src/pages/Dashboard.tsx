function Dashboard() {
    // Mock data - will be replaced with real Supabase data
    const stats = [
        { label: 'Total Leads', value: '1,234', change: '+12%', icon: '👥' },
        { label: 'Calls Today', value: '56', change: '+8%', icon: '📞' },
        { label: 'Success Rate', value: '78%', change: '+5%', icon: '✅' },
        { label: 'Avg Duration', value: '3:42', change: '-2%', icon: '⏱️' },
    ];

    const recentCalls = [
        { id: 1, name: 'Rahul Kumar', phone: '98XXXXXX12', status: 'completed', duration: '4:12' },
        { id: 2, name: 'Priya Singh', phone: '87XXXXXX45', status: 'in_progress', duration: '2:30' },
        { id: 3, name: 'Amit Sharma', phone: '91XXXXXX78', status: 'failed', duration: '0:45' },
        { id: 4, name: 'Neha Gupta', phone: '88XXXXXX34', status: 'completed', duration: '3:55' },
    ];

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <button className="btn btn-primary">+ New Campaign</button>
            </div>

            <div className="stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-card card">
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
                                    <td>{call.name}</td>
                                    <td>{call.phone}</td>
                                    <td>
                                        <span className={`badge badge-${call.status === 'completed' ? 'success' : call.status === 'in_progress' ? 'warning' : 'error'}`}>
                                            {call.status}
                                        </span>
                                    </td>
                                    <td>{call.duration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card agent-status">
                    <h3>AI Agent Status</h3>
                    <div className="agent-info">
                        <div className="agent-indicator online"></div>
                        <div>
                            <p className="agent-name">Main Agent</p>
                            <p className="agent-subtitle">Online • 3 active calls</p>
                        </div>
                    </div>
                    <div className="agent-stats">
                        <div className="agent-stat">
                            <span className="agent-stat-value">156</span>
                            <span className="agent-stat-label">Calls Today</span>
                        </div>
                        <div className="agent-stat">
                            <span className="agent-stat-value">92%</span>
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
