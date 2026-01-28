import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
    const { user, sipAccounts, callingLimits } = useAuth();

    const usagePercent = callingLimits
        ? Math.min(Math.round((callingLimits.used_minutes_month / callingLimits.monthly_minutes_limit) * 100), 100)
        : 0;

    const dailyPercent = callingLimits
        ? Math.min(Math.round((callingLimits.calls_today / callingLimits.daily_call_limit) * 100), 100)
        : 0;

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome back, {user?.name || 'User'}!</h1>
                    <p className="page-description">Here's an overview of your calling activity</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📞</div>
                    <div className="stat-value">{callingLimits?.calls_today ?? 0}</div>
                    <div className="stat-label">Calls Today</div>
                    <div className="progress-bar" style={{ marginTop: '1rem' }}>
                        <div className="progress-fill" style={{ width: `${dailyPercent}%` }}></div>
                    </div>
                    <div className="stat-sublabel">
                        {callingLimits?.daily_call_limit ?? 0} daily limit
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">{callingLimits?.used_minutes_month ?? 0}</div>
                    <div className="stat-label">Minutes This Month</div>
                    <div className="progress-bar" style={{ marginTop: '1rem' }}>
                        <div className="progress-fill" style={{ width: `${usagePercent}%` }}></div>
                    </div>
                    <div className="stat-sublabel">
                        {callingLimits?.monthly_minutes_limit ?? 0} monthly limit
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🔌</div>
                    <div className="stat-value">{sipAccounts?.length ?? 0}</div>
                    <div className="stat-label">SIP Accounts</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-value">{callingLimits?.concurrent_call_limit ?? 0}</div>
                    <div className="stat-label">Max Concurrent Calls</div>
                </div>
            </div>

            {sipAccounts && sipAccounts.length > 0 ? (
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
                            {sipAccounts.map((sip: any) => (
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
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📞</div>
                        <div className="empty-state-title">No SIP Accounts</div>
                        <div className="empty-state-text">Contact admin to set up your SIP account</div>
                    </div>
                </div>
            )}

            <style>{`
                .stat-sublabel {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-top: 0.5rem;
                }
            `}</style>
        </div>
    );
}
