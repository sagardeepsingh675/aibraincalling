import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Agent {
    id: string;
    name: string;
    voice_id: string;
    is_active: boolean;
    prompt_template: string;
    created_at: string;
}

export default function Agents() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        const { data } = await supabase
            .from('vc_agents')
            .select('*')
            .order('created_at', { ascending: false });
        setAgents(data || []);
        setLoading(false);
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
                <h1 className="page-title">AI Agents</h1>
                <p className="page-description">View and configure your AI calling agents</p>
            </div>

            <div className="agents-grid">
                {agents.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>No AI agents configured yet.</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Contact your administrator to set up AI agents.
                        </p>
                    </div>
                ) : (
                    agents.map((agent) => (
                        <div key={agent.id} className="agent-card card">
                            <div className="agent-header">
                                <div className="agent-avatar">🤖</div>
                                <div className="agent-info">
                                    <h3>{agent.name}</h3>
                                    <span className={`badge ${agent.is_active ? 'badge-success' : 'badge-error'}`}>
                                        {agent.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="agent-details">
                                <div className="detail-row">
                                    <span className="detail-label">Voice ID</span>
                                    <code>{agent.voice_id}</code>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Prompt Preview</span>
                                    <p className="prompt-preview">
                                        {agent.prompt_template.slice(0, 150)}...
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .agents-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }
                .agent-card {
                    padding: 1.5rem;
                }
                .agent-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .agent-avatar {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                .agent-info h3 {
                    font-size: 1.125rem;
                    margin-bottom: 0.25rem;
                }
                .agent-details {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .detail-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .detail-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                code {
                    background: rgba(99, 102, 241, 0.2);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.875rem;
                }
                .prompt-preview {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
