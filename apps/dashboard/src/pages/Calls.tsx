import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Call {
    id: string;
    lead_id: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    duration: number | null;
    created_at: string;
}

export default function Calls() {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCalls();
    }, []);

    const fetchCalls = async () => {
        // In a real implementation, this would filter by user's leads
        const { data } = await supabase
            .from('vc_calls')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        setCalls(data || []);
        setLoading(false);
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'completed': 'badge-success',
            'in_progress': 'badge-warning',
            'failed': 'badge-error',
            'queued': 'badge-secondary',
        };
        return styles[status] || 'badge-secondary';
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Call History</h1>
                <p className="page-description">View your recent calls and their status</p>
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Lead ID</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Started At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calls.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                                    No calls found
                                </td>
                            </tr>
                        ) : (
                            calls.map((call) => (
                                <tr key={call.id}>
                                    <td>{formatDate(call.created_at)}</td>
                                    <td><code>{call.lead_id.slice(0, 8)}...</code></td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(call.status)}`}>
                                            {call.status}
                                        </span>
                                    </td>
                                    <td>{formatDuration(call.duration)}</td>
                                    <td>{call.started_at ? formatDate(call.started_at) : '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                code {
                    background: rgba(99, 102, 241, 0.2);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.875rem;
                }
                .badge-secondary {
                    background: rgba(148, 163, 184, 0.1);
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}
