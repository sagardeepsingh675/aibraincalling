import { useState, useEffect, useCallback } from 'react';

interface ServiceStatus {
    status: string;
    active: boolean;
    activeChannels?: number;
    memory?: number;
    cpu?: number;
    uptime?: number;
}

interface Statuses {
    asterisk: ServiceStatus;
    aiBrain: ServiceStatus;
    pendingSIPSync: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.incallai.online';

export default function ServerManagement() {
    const [statuses, setStatuses] = useState<Statuses | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
    };

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/server/status`);
            const data = await response.json();
            if (data.success) {
                setStatuses(data.statuses);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
        setLoading(false);
        setLastRefresh(new Date());
    }, []);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleAction = async (action: string, endpoint: string) => {
        setActionLoading(action);
        addLog(`Executing: ${action}...`);
        try {
            const response = await fetch(`${API_URL}/api/server${endpoint}`, { method: 'POST' });
            const data = await response.json();
            addLog(data.success ? `✅ ${data.message}` : `❌ ${data.error}`);
            await fetchStatus();
        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
        }
        setActionLoading(null);
    };

    const formatUptime = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    const formatMemory = (bytes: number) => {
        return `${Math.round(bytes / 1024 / 1024)} MB`;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(99, 102, 241, 0.3)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>🖥️ Server Management</h1>
                    <p style={{ color: '#94a3b8' }}>
                        Manage Asterisk, AI Brain, and SIP synchronization
                        <span style={{ marginLeft: '1rem', fontSize: '0.875rem' }}>
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </span>
                    </p>
                </div>
                <button
                    onClick={fetchStatus}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    🔄 Refresh Status
                </button>
            </div>

            {/* Service Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Asterisk Card */}
                <div style={{
                    background: 'rgba(26, 26, 46, 0.8)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>📞</div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Asterisk</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>PBX Server</p>
                        </div>
                        <span style={{
                            marginLeft: 'auto',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            background: statuses?.asterisk?.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: statuses?.asterisk?.active ? '#10b981' : '#ef4444'
                        }}>
                            {statuses?.asterisk?.active ? '● Running' : '○ Stopped'}
                        </span>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Active Channels</span>
                            <span style={{ fontWeight: 600 }}>{statuses?.asterisk?.activeChannels || 0}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => handleAction('Restart Asterisk', '/asterisk/restart')}
                            disabled={actionLoading === 'Restart Asterisk'}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                opacity: actionLoading === 'Restart Asterisk' ? 0.5 : 1
                            }}
                        >
                            {actionLoading === 'Restart Asterisk' ? '⏳' : '🔄'} Restart
                        </button>
                        <button
                            onClick={() => handleAction('Reload PJSIP', '/asterisk/reload-pjsip')}
                            disabled={actionLoading === 'Reload PJSIP'}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#6366f1',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                opacity: actionLoading === 'Reload PJSIP' ? 0.5 : 1
                            }}
                        >
                            {actionLoading === 'Reload PJSIP' ? '⏳' : '📡'} Reload SIP
                        </button>
                    </div>
                </div>

                {/* AI Brain Card */}
                <div style={{
                    background: 'rgba(26, 26, 46, 0.8)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>🧠</div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>AI Brain</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>Voice AI Engine</p>
                        </div>
                        <span style={{
                            marginLeft: 'auto',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            background: statuses?.aiBrain?.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: statuses?.aiBrain?.active ? '#10b981' : '#ef4444'
                        }}>
                            {statuses?.aiBrain?.active ? '● Online' : '○ Offline'}
                        </span>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Memory</span>
                            <span style={{ fontWeight: 600 }}>{statuses?.aiBrain?.memory ? formatMemory(statuses.aiBrain.memory) : '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>CPU</span>
                            <span style={{ fontWeight: 600 }}>{statuses?.aiBrain?.cpu || 0}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Uptime</span>
                            <span style={{ fontWeight: 600 }}>
                                {statuses?.aiBrain?.uptime ? formatUptime(Date.now() - statuses.aiBrain.uptime) : '-'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => handleAction('Restart AI Brain', '/ai-brain/restart')}
                        disabled={actionLoading === 'Restart AI Brain'}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            opacity: actionLoading === 'Restart AI Brain' ? 0.5 : 1
                        }}
                    >
                        {actionLoading === 'Restart AI Brain' ? '⏳ Restarting...' : '🔄 Restart AI Brain'}
                    </button>
                </div>

                {/* SIP Sync Card */}
                <div style={{
                    background: 'rgba(26, 26, 46, 0.8)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>🔗</div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>SIP Sync</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>Asterisk Integration</p>
                        </div>
                    </div>

                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: statuses?.pendingSIPSync ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            color: statuses?.pendingSIPSync ? '#f59e0b' : '#10b981'
                        }}>
                            {statuses?.pendingSIPSync || 0}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Pending Sync</div>
                    </div>

                    <button
                        onClick={() => handleAction('Sync SIP Accounts', '/sip/sync')}
                        disabled={actionLoading === 'Sync SIP Accounts' || !statuses?.pendingSIPSync}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: statuses?.pendingSIPSync ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
                            color: statuses?.pendingSIPSync ? 'white' : '#64748b',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: statuses?.pendingSIPSync ? 'pointer' : 'default',
                            fontWeight: 500,
                            opacity: actionLoading === 'Sync SIP Accounts' ? 0.5 : 1
                        }}
                    >
                        {actionLoading === 'Sync SIP Accounts' ? '⏳ Syncing...' : '🚀 Sync All to Asterisk'}
                    </button>
                </div>
            </div>

            {/* Action Log */}
            <div style={{
                background: 'rgba(26, 26, 46, 0.8)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>📋 Action Log</h2>
                    <button
                        onClick={() => setLogs([])}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Clear
                    </button>
                </div>
                <div style={{
                    padding: '1rem 1.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                }}>
                    {logs.length === 0 ? (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                            No actions yet. Use the buttons above to manage services.
                        </div>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} style={{
                                padding: '0.5rem 0',
                                borderBottom: index < logs.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                color: log.includes('✅') ? '#10b981' : log.includes('❌') ? '#ef4444' : '#e2e8f0'
                            }}>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
