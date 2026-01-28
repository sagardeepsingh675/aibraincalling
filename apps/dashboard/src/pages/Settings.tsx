import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
    const { user, sipAccounts } = useAuth();
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const [testCallStatus, setTestCallStatus] = useState<Record<string, string>>({});

    const togglePassword = (id: string) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleTestCall = async (callerId: string, sipUsername: string) => {
        setTestCallStatus(prev => ({ ...prev, [sipUsername]: 'calling' }));
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.incallai.online'}/api/test-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caller_id: callerId, sip_username: sipUsername })
            });

            if (response.ok) {
                setTestCallStatus(prev => ({ ...prev, [sipUsername]: 'success' }));
                setTimeout(() => setTestCallStatus(prev => ({ ...prev, [sipUsername]: '' })), 3000);
            } else {
                setTestCallStatus(prev => ({ ...prev, [sipUsername]: 'error' }));
            }
        } catch {
            setTestCallStatus(prev => ({ ...prev, [sipUsername]: 'error' }));
        }
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
                        sipAccounts.map((sip: any) => (
                            <div key={sip.id} className="sip-card">
                                {/* Caller ID Badge */}
                                <div className="caller-id-section">
                                    <span className="caller-id-label">Your AI Caller ID</span>
                                    <span className="caller-id-badge">📞 {sip.caller_id || 'N/A'}</span>
                                    <p className="caller-id-help">Dial this extension to test your AI agent</p>
                                </div>

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

                                {/* Test Call Button */}
                                <div className="test-call-section">
                                    <button
                                        className={`test-call-btn ${testCallStatus[sip.sip_username] || ''}`}
                                        onClick={() => handleTestCall(sip.caller_id, sip.sip_username)}
                                        disabled={testCallStatus[sip.sip_username] === 'calling'}
                                    >
                                        {testCallStatus[sip.sip_username] === 'calling' ? (
                                            '🔄 Initiating Test Call...'
                                        ) : testCallStatus[sip.sip_username] === 'success' ? (
                                            '✅ Call Initiated!'
                                        ) : testCallStatus[sip.sip_username] === 'error' ? (
                                            '❌ Failed - Try Again'
                                        ) : (
                                            '🧪 Test AI Call'
                                        )}
                                    </button>
                                    <p className="test-call-help">
                                        This will trigger a test call to your AI agent
                                    </p>
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
                    padding: 1.25rem;
                    margin-top: 1rem;
                }
                .caller-id-section {
                    text-align: center;
                    padding: 1rem;
                    background: rgba(245, 158, 11, 0.1);
                    border-radius: 12px;
                    margin-bottom: 1rem;
                }
                .caller-id-label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.5rem;
                }
                .caller-id-badge {
                    display: inline-block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #f59e0b;
                    background: rgba(245, 158, 11, 0.2);
                    padding: 0.5rem 1.5rem;
                    border-radius: 12px;
                }
                .caller-id-help {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-top: 0.5rem;
                    margin-bottom: 0;
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
                .test-call-section {
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-color);
                    text-align: center;
                }
                .test-call-btn {
                    width: 100%;
                    padding: 0.875rem 1.5rem;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 200ms ease;
                }
                .test-call-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
                }
                .test-call-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .test-call-btn.success {
                    background: linear-gradient(135deg, #10b981, #059669);
                }
                .test-call-btn.error {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                }
                .test-call-help {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-top: 0.75rem;
                    margin-bottom: 0;
                }
            `}</style>
        </div>
    );
}
