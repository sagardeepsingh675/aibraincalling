import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
    const { user, sipAccounts } = useAuth();
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

    const togglePassword = (id: string) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-description">Manage your account and SIP credentials</p>
            </div>

            <div className="settings-grid">
                <div className="card">
                    <h2 className="card-title">👤 Profile Information</h2>
                    <div className="profile-details">
                        <div className="detail-row">
                            <span className="detail-label">Name</span>
                            <span className="detail-value">{user?.name}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{user?.email}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Company</span>
                            <span className="detail-value">{user?.company || 'Not set'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{user?.phone || 'Not set'}</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="card-title">📞 SIP Credentials</h2>
                    <p className="card-description">Use these credentials to connect your SIP phone</p>

                    {sipAccounts.length === 0 ? (
                        <p className="no-data">No SIP accounts assigned. Contact your administrator.</p>
                    ) : (
                        sipAccounts.map((sip) => (
                            <div key={sip.id} className="sip-card">
                                <div className="sip-row">
                                    <span className="sip-label">Server</span>
                                    <code>{sip.sip_server}:{sip.sip_port}</code>
                                </div>
                                <div className="sip-row">
                                    <span className="sip-label">Username</span>
                                    <code>{sip.sip_username}</code>
                                </div>
                                <div className="sip-row">
                                    <span className="sip-label">Password</span>
                                    <div className="password-field">
                                        <code className={showPassword[sip.id] ? '' : 'blur'}>
                                            {sip.sip_password}
                                        </code>
                                        <button
                                            className="btn-icon"
                                            onClick={() => togglePassword(sip.id)}
                                        >
                                            {showPassword[sip.id] ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 1.5rem;
                }
                .card-title {
                    font-size: 1.125rem;
                    margin-bottom: 0.5rem;
                }
                .card-description {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-bottom: 1.5rem;
                }
                .profile-details {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .detail-label {
                    color: var(--text-secondary);
                }
                .detail-value {
                    font-weight: 500;
                }
                .sip-card {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-top: 1rem;
                }
                .sip-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0;
                }
                .sip-label {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }
                code {
                    background: rgba(99, 102, 241, 0.2);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-family: monospace;
                }
                code.blur {
                    filter: blur(4px);
                    user-select: none;
                }
                .password-field {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .btn-icon {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1rem;
                    padding: 0.25rem;
                }
                .no-data {
                    color: var(--text-secondary);
                    font-style: italic;
                    margin-top: 1rem;
                }
            `}</style>
        </div>
    );
}
