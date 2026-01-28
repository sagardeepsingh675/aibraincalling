import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Call {
    id: string;
    status: string;
    duration: number | null;
    started_at: string | null;
    ended_at: string | null;
    lead?: any;
}

export default function Calls() {
    const { user } = useAuth();
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchCalls();
    }, [user]);

    const fetchCalls = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('vc_calls')
                .select(`
                    id,
                    status,
                    duration,
                    started_at,
                    ended_at,
                    lead:vc_leads(name, phone)
                `)
                .eq('user_id', user.id)
                .order('started_at', { ascending: false })
                .limit(50);

            setCalls(data || []);
        } catch (error) {
            console.error('Error fetching calls:', error);
        }
        setLoading(false);
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'badge-success';
            case 'in_progress': return 'badge-warning';
            case 'failed': return 'badge-error';
            default: return 'badge-primary';
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="calls-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Call History</h1>
                    <p className="page-description">View all your past calls</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchCalls}>
                    🔄 Refresh
                </button>
            </div>

            <div className="card">
                {calls.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📞</div>
                        <div className="empty-state-title">No Calls Yet</div>
                        <div className="empty-state-text">Your call history will appear here</div>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Lead</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calls.map((call) => (
                                <tr key={call.id}>
                                    <td>{(call.lead as any)?.name || 'Unknown'}</td>
                                    <td><code>{(call.lead as any)?.phone || '-'}</code></td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(call.status)}`}>
                                            {call.status}
                                        </span>
                                    </td>
                                    <td>{formatDuration(call.duration)}</td>
                                    <td>{formatDate(call.started_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
