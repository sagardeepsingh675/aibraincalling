import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/AgentConfig.css';

interface CallAnalytic {
    id: string;
    call_id: string;
    pitch_delivered: boolean;
    user_interested: boolean;
    callback_scheduled: boolean;
    call_successful: boolean;
    user_engagement_score: number;
    conversation_turns: number;
    total_duration_seconds: number;
    steps_completed: string[];
    created_at: string;
}

interface AnalyticsSummary {
    totalCalls: number;
    successfulCalls: number;
    pitchesDelivered: number;
    interestedUsers: number;
    callbacksScheduled: number;
    avgEngagement: number;
    avgDuration: number;
}

export default function CallAnalytics() {
    const [analytics, setAnalytics] = useState<CallAnalytic[]>([]);
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7d');

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysAgo);

            const { data, error } = await supabase
                .from('vc_call_analytics')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            setAnalytics(data || []);
            calculateSummary(data || []);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data: CallAnalytic[]) => {
        if (data.length === 0) {
            setSummary({
                totalCalls: 0,
                successfulCalls: 0,
                pitchesDelivered: 0,
                interestedUsers: 0,
                callbacksScheduled: 0,
                avgEngagement: 0,
                avgDuration: 0
            });
            return;
        }

        const totalCalls = data.length;
        const successfulCalls = data.filter(a => a.call_successful).length;
        const pitchesDelivered = data.filter(a => a.pitch_delivered).length;
        const interestedUsers = data.filter(a => a.user_interested).length;
        const callbacksScheduled = data.filter(a => a.callback_scheduled).length;
        const avgEngagement = data.reduce((sum, a) => sum + (a.user_engagement_score || 0), 0) / totalCalls;
        const avgDuration = data.reduce((sum, a) => sum + (a.total_duration_seconds || 0), 0) / totalCalls;

        setSummary({
            totalCalls,
            successfulCalls,
            pitchesDelivered,
            interestedUsers,
            callbacksScheduled,
            avgEngagement,
            avgDuration
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="loading">Loading analytics...</div>;
    }

    return (
        <div className="analytics-page">
            <div className="page-header">
                <h1>📊 Call Analytics</h1>
                <p>Track AI agent performance and call outcomes</p>
            </div>

            <div className="filter-bar">
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                </select>
            </div>

            {summary && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>📞 Total Calls</h3>
                        <div className="value">{summary.totalCalls}</div>
                    </div>

                    <div className="stat-card">
                        <h3>✅ Successful</h3>
                        <div className="value">{summary.successfulCalls}</div>
                        <div className="trend">
                            {summary.totalCalls > 0
                                ? `${((summary.successfulCalls / summary.totalCalls) * 100).toFixed(1)}%`
                                : '0%'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <h3>📢 Pitches Delivered</h3>
                        <div className="value">{summary.pitchesDelivered}</div>
                        <div className="trend">
                            {summary.totalCalls > 0
                                ? `${((summary.pitchesDelivered / summary.totalCalls) * 100).toFixed(1)}%`
                                : '0%'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <h3>🎯 Interested Users</h3>
                        <div className="value">{summary.interestedUsers}</div>
                        <div className="trend">
                            {summary.totalCalls > 0
                                ? `${((summary.interestedUsers / summary.totalCalls) * 100).toFixed(1)}%`
                                : '0%'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <h3>📅 Callbacks Scheduled</h3>
                        <div className="value">{summary.callbacksScheduled}</div>
                    </div>

                    <div className="stat-card">
                        <h3>⏱️ Avg Duration</h3>
                        <div className="value">{formatDuration(Math.round(summary.avgDuration))}</div>
                    </div>

                    <div className="stat-card">
                        <h3>💬 Avg Engagement</h3>
                        <div className="value">{(summary.avgEngagement * 100).toFixed(0)}%</div>
                    </div>
                </div>
            )}

            <div className="chart-container">
                <h3>Recent Calls</h3>
                {analytics.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                        No call analytics yet. Make some calls to see data here!
                    </p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Duration</th>
                                <th>Turns</th>
                                <th>Pitch</th>
                                <th>Interest</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.slice(0, 20).map((call) => (
                                <tr key={call.id}>
                                    <td>{formatDate(call.created_at)}</td>
                                    <td>{formatDuration(call.total_duration_seconds || 0)}</td>
                                    <td>{call.conversation_turns}</td>
                                    <td>
                                        <span className={`badge ${call.pitch_delivered ? 'success' : 'warning'}`}>
                                            {call.pitch_delivered ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${call.user_interested ? 'success' : 'danger'}`}>
                                            {call.user_interested ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${call.call_successful ? 'success' : 'warning'}`}>
                                            {call.call_successful ? 'Success' : call.callback_scheduled ? 'Callback' : 'No Sale'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
