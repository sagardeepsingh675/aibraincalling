import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/AgentConfig.css';

interface AgentConfig {
    id: string;
    agent_name: string;
    company_name: string;
    voice_style: string;
    greeting_template: string;
    availability_question: string;
    positive_responses: string[];
    negative_responses: string[];
    pitch_script: string;
    pitch_key_points: string[];
    positive_close_message: string;
    negative_close_message: string;
    callback_message: string;
    max_turns: number;
    recording_enabled: boolean;
    analytics_enabled: boolean;
    is_active: boolean;
}

export default function AgentConfig() {
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('vc_agent_config')
                .select('*')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setConfig(data);
        } catch (error) {
            console.error('Error fetching config:', error);
            setMessage({ type: 'error', text: 'Failed to load configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('vc_agent_config')
                .upsert({
                    ...config,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', text: 'Failed to save configuration' });
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (field: keyof AgentConfig, value: any) => {
        if (!config) return;
        setConfig({ ...config, [field]: value });
    };

    const updateArrayField = (field: keyof AgentConfig, value: string) => {
        const arr = value.split(',').map(s => s.trim()).filter(s => s);
        updateConfig(field, arr);
    };

    if (loading) {
        return <div className="loading">Loading configuration...</div>;
    }

    return (
        <div className="agent-config">
            <div className="page-header">
                <h1>🤖 AI Agent Configuration</h1>
                <p>Configure how your AI agent behaves during calls</p>
            </div>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="config-sections">
                {/* Agent Persona */}
                <section className="config-section">
                    <h2>👤 Agent Persona</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Agent Name</label>
                            <input
                                type="text"
                                value={config?.agent_name || ''}
                                onChange={(e) => updateConfig('agent_name', e.target.value)}
                                placeholder="e.g., Priya, Sarah, Ravi"
                            />
                            <small>The name your AI agent will use to introduce itself</small>
                        </div>

                        <div className="form-group">
                            <label>Company Name</label>
                            <input
                                type="text"
                                value={config?.company_name || ''}
                                onChange={(e) => updateConfig('company_name', e.target.value)}
                                placeholder="e.g., AI Solutions Pvt Ltd"
                            />
                        </div>

                        <div className="form-group">
                            <label>Voice Style</label>
                            <select
                                value={config?.voice_style || 'friendly'}
                                onChange={(e) => updateConfig('voice_style', e.target.value)}
                            >
                                <option value="formal">Formal</option>
                                <option value="friendly">Friendly</option>
                                <option value="casual">Casual</option>
                                <option value="professional">Professional</option>
                            </select>
                        </div>

                        <div className="form-group toggle-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config?.is_active || false}
                                    onChange={(e) => updateConfig('is_active', e.target.checked)}
                                />
                                Agent Active
                            </label>
                            <small>Enable or disable the AI agent</small>
                        </div>
                    </div>
                </section>

                {/* Greeting & Availability */}
                <section className="config-section">
                    <h2>👋 Greeting & Availability Check</h2>
                    <div className="form-group full-width">
                        <label>Greeting Template</label>
                        <textarea
                            value={config?.greeting_template || ''}
                            onChange={(e) => updateConfig('greeting_template', e.target.value)}
                            rows={3}
                            placeholder="Namaste! Main {agent_name} bol rahi hoon {company_name} se..."
                        />
                        <small>Use {'{agent_name}'} and {'{company_name}'} as placeholders</small>
                    </div>

                    <div className="form-group full-width">
                        <label>Availability Question</label>
                        <input
                            type="text"
                            value={config?.availability_question || ''}
                            onChange={(e) => updateConfig('availability_question', e.target.value)}
                            placeholder="Kya aapke paas 2 minute hain?"
                        />
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Positive Responses (comma-separated)</label>
                            <input
                                type="text"
                                value={config?.positive_responses?.join(', ') || ''}
                                onChange={(e) => updateArrayField('positive_responses', e.target.value)}
                                placeholder="ha, haan, yes, okay, bilkul"
                            />
                            <small>Words that indicate the user is available</small>
                        </div>

                        <div className="form-group">
                            <label>Negative Responses (comma-separated)</label>
                            <input
                                type="text"
                                value={config?.negative_responses?.join(', ') || ''}
                                onChange={(e) => updateArrayField('negative_responses', e.target.value)}
                                placeholder="nahi, no, busy, abhi nahi"
                            />
                        </div>
                    </div>
                </section>

                {/* Product Pitch */}
                <section className="config-section">
                    <h2>📢 Product Pitch</h2>
                    <div className="form-group full-width">
                        <label>Pitch Script</label>
                        <textarea
                            value={config?.pitch_script || ''}
                            onChange={(e) => updateConfig('pitch_script', e.target.value)}
                            rows={5}
                            placeholder="Main aapko batana chahti hoon ki humare paas ek bahut hi innovative solution hai..."
                        />
                        <small>What the AI will say when pitching your product</small>
                    </div>

                    <div className="form-group full-width">
                        <label>Key Points (comma-separated)</label>
                        <input
                            type="text"
                            value={config?.pitch_key_points?.join(', ') || ''}
                            onChange={(e) => updateArrayField('pitch_key_points', e.target.value)}
                            placeholder="Automated solution, Save time, Increase revenue"
                        />
                    </div>
                </section>

                {/* Closing Messages */}
                <section className="config-section">
                    <h2>👋 Closing Messages</h2>
                    <div className="form-group full-width">
                        <label>Positive Close (when user is interested)</label>
                        <textarea
                            value={config?.positive_close_message || ''}
                            onChange={(e) => updateConfig('positive_close_message', e.target.value)}
                            rows={2}
                            placeholder="Bahut shukriya! Main aapko details share kar deti hoon..."
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Negative Close (when user is not interested)</label>
                        <textarea
                            value={config?.negative_close_message || ''}
                            onChange={(e) => updateConfig('negative_close_message', e.target.value)}
                            rows={2}
                            placeholder="Koi baat nahi! Thank you for your time..."
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Callback Message</label>
                        <textarea
                            value={config?.callback_message || ''}
                            onChange={(e) => updateConfig('callback_message', e.target.value)}
                            rows={2}
                            placeholder="Accha ji, kab call kar sakti hoon?"
                        />
                    </div>
                </section>

                {/* Settings */}
                <section className="config-section">
                    <h2>⚙️ Settings</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Max Conversation Turns</label>
                            <input
                                type="number"
                                value={config?.max_turns || 10}
                                onChange={(e) => updateConfig('max_turns', parseInt(e.target.value))}
                                min={1}
                                max={50}
                            />
                        </div>

                        <div className="form-group toggle-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config?.recording_enabled || false}
                                    onChange={(e) => updateConfig('recording_enabled', e.target.checked)}
                                />
                                Enable Call Recording
                            </label>
                        </div>

                        <div className="form-group toggle-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config?.analytics_enabled || false}
                                    onChange={(e) => updateConfig('analytics_enabled', e.target.checked)}
                                />
                                Enable Analytics
                            </label>
                        </div>
                    </div>
                </section>
            </div>

            <div className="actions">
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save Configuration'}
                </button>
            </div>
        </div>
    );
}
