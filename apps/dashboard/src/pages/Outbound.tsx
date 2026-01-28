import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Outbound() {
    const { sipAccounts, callingLimits } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedSIP, setSelectedSIP] = useState('');
    const [isDialing, setIsDialing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const canMakeCalls = callingLimits
        ? callingLimits.calls_today < callingLimits.daily_call_limit
        : false;

    const handleDial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || !selectedSIP) {
            setMessage({ type: 'error', text: 'Please enter a phone number and select a SIP account' });
            return;
        }

        if (!canMakeCalls) {
            setMessage({ type: 'error', text: 'Daily call limit reached' });
            return;
        }

        setIsDialing(true);
        setMessage(null);

        try {
            // This would call your AI Brain API to initiate a call
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/calls/outbound`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: phoneNumber,
                    sipAccount: selectedSIP,
                }),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Call initiated successfully!' });
                setPhoneNumber('');
            } else {
                throw new Error('Failed to initiate call');
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to initiate call. Please try again.' });
        }

        setIsDialing(false);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Make Outbound Calls</h1>
                <p className="page-description">Initiate calls to leads using your SIP accounts</p>
            </div>

            {!canMakeCalls && (
                <div className="alert alert-warning">
                    ⚠️ You've reached your daily call limit ({callingLimits?.daily_call_limit} calls).
                    Please try again tomorrow.
                </div>
            )}

            <div className="card dialer-card">
                <form onSubmit={handleDial} className="dialer-form">
                    {message && (
                        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">SIP Account</label>
                        <select
                            value={selectedSIP}
                            onChange={(e) => setSelectedSIP(e.target.value)}
                            className="form-input"
                            required
                        >
                            <option value="">Select a SIP account</option>
                            {sipAccounts.filter(s => s.is_active).map((sip) => (
                                <option key={sip.id} value={sip.sip_username}>
                                    {sip.sip_username} ({sip.sip_server})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="form-input phone-input"
                            placeholder="+1 (555) 123-4567"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-success dial-btn"
                        disabled={isDialing || !canMakeCalls}
                    >
                        {isDialing ? '📞 Dialing...' : '📞 Dial Number'}
                    </button>
                </form>

                <div className="call-info">
                    <div className="info-item">
                        <span className="info-label">Calls Remaining Today</span>
                        <span className="info-value">
                            {callingLimits ? callingLimits.daily_call_limit - callingLimits.calls_today : 0}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Minutes Remaining</span>
                        <span className="info-value">
                            {callingLimits ? callingLimits.monthly_minutes_limit - callingLimits.used_minutes_month : 0}
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                .dialer-card {
                    max-width: 500px;
                }
                .dialer-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .phone-input {
                    font-size: 1.25rem;
                    padding: 1rem;
                    letter-spacing: 0.05em;
                }
                .dial-btn {
                    padding: 1rem;
                    font-size: 1rem;
                    margin-top: 0.5rem;
                }
                .alert {
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                .alert-warning {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    color: #f59e0b;
                }
                .alert-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                }
                .alert-success {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #10b981;
                }
                .call-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--border-color);
                }
                .info-item {
                    text-align: center;
                }
                .info-label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-bottom: 0.25rem;
                }
                .info-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--color-primary);
                }
            `}</style>
        </div>
    );
}
