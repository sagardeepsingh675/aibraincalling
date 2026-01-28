import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
    const { user, sipAccounts, callingLimits } = useAuth();

    const usagePercent = callingLimits
        ? Math.round((callingLimits.used_minutes_month / callingLimits.monthly_minutes_limit) * 100)
        : 0;

    const dailyPercent = callingLimits
        ? Math.round((callingLimits.calls_today / callingLimits.daily_call_limit) * 100)
        : 0;

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1 className="page-title">Welcome back, {user?.name}!</h1>
                <p className="page-description">Here's an overview of your calling activity</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📞</div>
                    <div className="stat-value">{callingLimits?.calls_today || 0}</div>
                    <div className="stat-label">Calls Today</div>
                    <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                        <div className="progress-fill" style={{ width: `${dailyPercent}%` }}></div>
                    </div>
                    <div className="stat-limit">{callingLimits?.daily_call_limit || 0} daily limit</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">{callingLimits?.used_minutes_month || 0}</div>
                    <div className="stat-label">Minutes This Month</div>
                    <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                        <div className="progress-fill" style={{ width: `${usagePercent}%` }}></div>
                    </div>
                    <div className="stat-limit">{callingLimits?.monthly_minutes_limit || 0} monthly limit</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🔌</div>
                    <div className="stat-value">{sipAccounts.length}</div>
                    <div className="stat-label">SIP Accounts</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-value">{callingLimits?.concurrent_call_limit || 0}</div>
                    <div className="stat-label">Max Concurrent Calls</div>
                </div>
            </div>

            {sipAccounts.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Your SIP Accounts</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Server</th>
                                <th>Port</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sipAccounts.map((sip) => (
                                <tr key={sip.id}>
                                    <td><code>{sip.sip_username}</code></td>
                                    <td>{sip.sip_server}</td>
                                    <td>{sip.sip_port}</td>
                                    <td>
                                        <span className={`badge ${sip.is_active ? 'badge-success' : 'badge-error'}`}>
                                            {sip.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                .stat-icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }
                .stat-limit {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-top: 0.5rem;
                }
                code {
                    background: rgba(99, 102, 241, 0.2);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-family: monospace;
                }
            `}</style>
        </div>
    );
}
