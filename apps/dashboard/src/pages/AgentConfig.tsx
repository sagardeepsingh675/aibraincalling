import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AgentConfig {
    id?: string;
    agent_name: string;
    company_name: string;
    voice_style: string;
    elevenlabs_voice_id: string;
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

const ELEVENLABS_VOICES = [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female, Warm)', language: 'English' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Female, Professional)', language: 'English' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Female, Strong)', language: 'English' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Female, Young)', language: 'English' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Male, Deep)', language: 'English' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Male, Strong)', language: 'English' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male, Narrator)', language: 'English' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam (Male, Raspy)', language: 'English' },
    { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya (Female, Nordic)', language: 'English' },
    { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace (Female, Southern)', language: 'English' },
];

const VOICE_STYLES = ['friendly', 'professional', 'energetic', 'calm', 'persuasive'];

const defaultConfig: AgentConfig = {
    agent_name: '',
    company_name: '',
    voice_style: 'friendly',
    elevenlabs_voice_id: 'EXAVITQu4vr4xnSDxMaL',
    greeting_template: 'Hello! I am {agent_name} from {company_name}. How are you today?',
    availability_question: 'Do you have 2 minutes to talk?',
    positive_responses: ['yes', 'sure', 'okay', 'go ahead'],
    negative_responses: ['no', 'not now', 'busy', 'later'],
    pitch_script: '',
    pitch_key_points: [],
    positive_close_message: 'Thank you for your time! Have a great day!',
    negative_close_message: 'No problem! Feel free to contact us anytime. Thank you!',
    callback_message: 'When would be a good time to call you back?',
    max_turns: 10,
    recording_enabled: true,
    analytics_enabled: true,
    is_active: true,
};

export default function AgentConfig() {
    const { user } = useAuth();
    const [config, setConfig] = useState<AgentConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [keyPointInput, setKeyPointInput] = useState('');
    const [positiveInput, setPositiveInput] = useState('');
    const [negativeInput, setNegativeInput] = useState('');

    useEffect(() => {
        fetchConfig();
    }, [user]);

    const fetchConfig = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('vc_agent_config')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setConfig(data);
            }
        } catch {
            console.log('No existing config, using defaults');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            const configData = {
                ...config,
                user_id: user.id,
                updated_at: new Date().toISOString(),
            };

            if (config.id) {
                const { error } = await supabase
                    .from('vc_agent_config')
                    .update(configData)
                    .eq('id', config.id);

                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('vc_agent_config')
                    .insert([{ ...configData, created_at: new Date().toISOString() }])
                    .select()
                    .single();

                if (error) throw error;
                if (data) setConfig(data);
            }

            setMessage({ type: 'success', text: 'Agent configuration saved successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save configuration' });
        }
        setSaving(false);
    };

    const addKeyPoint = () => {
        if (keyPointInput.trim()) {
            setConfig({ ...config, pitch_key_points: [...config.pitch_key_points, keyPointInput.trim()] });
            setKeyPointInput('');
        }
    };

    const removeKeyPoint = (index: number) => {
        setConfig({ ...config, pitch_key_points: config.pitch_key_points.filter((_, i) => i !== index) });
    };

    const addPositiveResponse = () => {
        if (positiveInput.trim()) {
            setConfig({ ...config, positive_responses: [...config.positive_responses, positiveInput.trim()] });
            setPositiveInput('');
        }
    };

    const addNegativeResponse = () => {
        if (negativeInput.trim()) {
            setConfig({ ...config, negative_responses: [...config.negative_responses, negativeInput.trim()] });
            setNegativeInput('');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const cardStyle: React.CSSProperties = {
        background: 'var(--card-bg)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 500,
        color: 'var(--text-primary)',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'var(--input-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
    };

    const textareaStyle: React.CSSProperties = {
        ...inputStyle,
        minHeight: '100px',
        resize: 'vertical' as const,
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        cursor: 'pointer',
    };

    const tagStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0.75rem',
        background: 'var(--primary-light)',
        color: 'var(--primary)',
        borderRadius: '20px',
        fontSize: '0.85rem',
        margin: '0.25rem',
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1>🤖 AI Agent Configuration</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Configure how your AI agent behaves during calls
                </p>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
                }}>
                    {message.text}
                </div>
            )}

            {/* Agent Persona */}
            <div style={cardStyle}>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    👤 Agent Persona
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Agent Name</label>
                        <input
                            type="text"
                            style={inputStyle}
                            value={config.agent_name}
                            onChange={(e) => setConfig({ ...config, agent_name: e.target.value })}
                            placeholder="e.g., Priya"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Company Name</label>
                        <input
                            type="text"
                            style={inputStyle}
                            value={config.company_name}
                            onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                            placeholder="e.g., AI Solutions"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Voice Style</label>
                        <select
                            style={selectStyle}
                            value={config.voice_style}
                            onChange={(e) => setConfig({ ...config, voice_style: e.target.value })}
                        >
                            {VOICE_STYLES.map(style => (
                                <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            checked={config.is_active}
                            onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                            style={{ marginRight: '0.5rem' }}
                        />
                        Agent Active
                    </label>
                </div>
            </div>

            {/* Voice Selection */}
            <div style={cardStyle}>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🎙️ ElevenLabs Voice
                </h2>
                <div>
                    <label style={labelStyle}>Select AI Voice</label>
                    <select
                        style={selectStyle}
                        value={config.elevenlabs_voice_id}
                        onChange={(e) => setConfig({ ...config, elevenlabs_voice_id: e.target.value })}
                    >
                        {ELEVENLABS_VOICES.map(voice => (
                            <option key={voice.id} value={voice.id}>
                                {voice.name} - {voice.language}
                            </option>
                        ))}
                    </select>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        This voice will be used for all AI-generated speech during calls
                    </p>
                </div>
            </div>

            {/* Greeting & Availability */}
            <div style={cardStyle}>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    👋 Greeting & Availability Check
                </h2>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Greeting Template</label>
                    <textarea
                        style={textareaStyle}
                        value={config.greeting_template}
                        onChange={(e) => setConfig({ ...config, greeting_template: e.target.value })}
                        placeholder="Use {agent_name} and {company_name} as placeholders"
                    />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Use {'{agent_name}'} and {'{company_name}'} as placeholders
                    </p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Availability Question</label>
                    <input
                        type="text"
                        style={inputStyle}
                        value={config.availability_question}
                        onChange={(e) => setConfig({ ...config, availability_question: e.target.value })}
                        placeholder="e.g., Do you have 2 minutes to talk?"
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Positive Responses (comma-separated)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                style={inputStyle}
                                value={positiveInput}
                                onChange={(e) => setPositiveInput(e.target.value)}
                                placeholder="yes, sure, okay"
                                onKeyPress={(e) => e.key === 'Enter' && addPositiveResponse()}
                            />
                            <button onClick={addPositiveResponse} className="btn btn-secondary">+</button>
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap' }}>
                            {config.positive_responses.map((resp, i) => (
                                <span key={i} style={tagStyle}>
                                    {resp}
                                    <button onClick={() => setConfig({ ...config, positive_responses: config.positive_responses.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Negative Responses (comma-separated)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                style={inputStyle}
                                value={negativeInput}
                                onChange={(e) => setNegativeInput(e.target.value)}
                                placeholder="no, busy, later"
                                onKeyPress={(e) => e.key === 'Enter' && addNegativeResponse()}
                            />
                            <button onClick={addNegativeResponse} className="btn btn-secondary">+</button>
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap' }}>
                            {config.negative_responses.map((resp, i) => (
                                <span key={i} style={{ ...tagStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                    {resp}
                                    <button onClick={() => setConfig({ ...config, negative_responses: config.negative_responses.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Pitch */}
            <div style={cardStyle}>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💼 Product Pitch
                </h2>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Pitch Script</label>
                    <textarea
                        style={{ ...textareaStyle, minHeight: '150px' }}
                        value={config.pitch_script}
                        onChange={(e) => setConfig({ ...config, pitch_script: e.target.value })}
                        placeholder="The main script your AI will use to pitch your product or service..."
                    />
                </div>
                <div>
                    <label style={labelStyle}>Key Points (comma-separated)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            type="text"
                            style={inputStyle}
                            value={keyPointInput}
                            onChange={(e) => setKeyPointInput(e.target.value)}
                            placeholder="Add a key point"
                            onKeyPress={(e) => e.key === 'Enter' && addKeyPoint()}
                        />
                        <button onClick={addKeyPoint} className="btn btn-primary">Add</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {config.pitch_key_points.map((point, i) => (
                            <span key={i} style={{ ...tagStyle, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                {point}
                                <button onClick={() => removeKeyPoint(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Closing Messages */}
            <div style={cardStyle}>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🤝 Closing Messages
                </h2>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Positive Close (when user is interested)</label>
                    <textarea
                        style={textareaStyle}
                        value={config.positive_close_message}
                        onChange={(e) => setConfig({ ...config, positive_close_message: e.target.value })}
                        placeholder="Thank you message when user shows interest..."
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Negative Close (when user is not interested)</label>
                    <textarea
                        style={textareaStyle}
                        value={config.negative_close_message}
                        onChange={(e) => setConfig({ ...config, negative_close_message: e.target.value })}
                        placeholder="Polite message when user declines..."
                    />
                </div>
                <div>
                    <label style={labelStyle}>Callback Message</label>
                    <textarea
                        style={textareaStyle}
                        value={config.callback_message}
                        onChange={(e) => setConfig({ ...config, callback_message: e.target.value })}
                        placeholder="Message when scheduling a callback..."
                    />
                </div>
            </div>

            {/* Settings */}
            <div style={cardStyle}>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚙️ Settings
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={labelStyle}>Max Conversation Turns</label>
                        <input
                            type="number"
                            style={inputStyle}
                            value={config.max_turns}
                            onChange={(e) => setConfig({ ...config, max_turns: parseInt(e.target.value) || 10 })}
                            min={1}
                            max={50}
                        />
                    </div>
                    <div>
                        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={config.recording_enabled}
                                onChange={(e) => setConfig({ ...config, recording_enabled: e.target.checked })}
                            />
                            Enable Call Recording
                        </label>
                    </div>
                    <div>
                        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={config.analytics_enabled}
                                onChange={(e) => setConfig({ ...config, analytics_enabled: e.target.checked })}
                            />
                            Enable Analytics
                        </label>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={fetchConfig} className="btn btn-secondary" disabled={saving}>
                    Reset
                </button>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save Configuration'}
                </button>
            </div>
        </div>
    );
}
