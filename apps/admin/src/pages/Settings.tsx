import { useState, useEffect } from 'react';

interface Settings {
    elevenLabsApiKey: string;
    groqApiKey: string;
    defaultVoiceId: string;
    maxConcurrentCalls: number;
    callRecording: boolean;
    analyticsEnabled: boolean;
    webhookUrl: string;
}

function Settings() {
    const [settings, setSettings] = useState<Settings>({
        elevenLabsApiKey: '',
        groqApiKey: '',
        defaultVoiceId: 'pFZP5JQG7iQjIQuC4Bku',
        maxConcurrentCalls: 5,
        callRecording: true,
        analyticsEnabled: true,
        webhookUrl: '',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Load settings from localStorage (API keys should be stored securely in backend)
        const saved = localStorage.getItem('admin_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // Save to localStorage (in production, sensitive data should go to backend)
            localStorage.setItem('admin_settings', JSON.stringify(settings));
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof Settings, value: string | number | boolean) => {
        setSettings({ ...settings, [key]: value });
    };

    const toggleKeyVisibility = (key: string) => {
        setShowKeys({ ...showKeys, [key]: !showKeys[key] });
    };

    // maskApiKey function removed - not currently used

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1 className="page-title">⚙️ Settings</h1>
                <p className="page-subtitle">Configure API keys, voice settings, and system preferences</p>
            </div>

            {message && (
                <div className={`message-banner ${message.type}`}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            <div className="settings-grid">
                {/* API Keys */}
                <div className="card settings-section">
                    <h2>🔑 API Configuration</h2>

                    <div className="form-group">
                        <label>ElevenLabs API Key</label>
                        <div className="api-key-input">
                            <input
                                type={showKeys['elevenlabs'] ? 'text' : 'password'}
                                value={settings.elevenLabsApiKey}
                                onChange={(e) => updateSetting('elevenLabsApiKey', e.target.value)}
                                placeholder="sk-..."
                            />
                            <button
                                className="btn-icon"
                                onClick={() => toggleKeyVisibility('elevenlabs')}
                                title={showKeys['elevenlabs'] ? 'Hide' : 'Show'}
                            >
                                {showKeys['elevenlabs'] ? '🙈' : '👁️'}
                            </button>
                        </div>
                        <small>Required for AI voice synthesis</small>
                    </div>

                    <div className="form-group">
                        <label>Groq API Key</label>
                        <div className="api-key-input">
                            <input
                                type={showKeys['groq'] ? 'text' : 'password'}
                                value={settings.groqApiKey}
                                onChange={(e) => updateSetting('groqApiKey', e.target.value)}
                                placeholder="gsk_..."
                            />
                            <button
                                className="btn-icon"
                                onClick={() => toggleKeyVisibility('groq')}
                            >
                                {showKeys['groq'] ? '🙈' : '👁️'}
                            </button>
                        </div>
                        <small>Required for AI conversation processing</small>
                    </div>

                    <div className="form-group">
                        <label>Default Voice ID</label>
                        <select
                            value={settings.defaultVoiceId}
                            onChange={(e) => updateSetting('defaultVoiceId', e.target.value)}
                        >
                            <option value="pFZP5JQG7iQjIQuC4Bku">Lily (Female, Indian)</option>
                            <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Female, American)</option>
                            <option value="AZnzlk1XvdvUeBnXmlld">Domi (Female, American)</option>
                            <option value="EXAVITQu4vr4xnSDxMaL">Bella (Female, American)</option>
                            <option value="MF3mGyEYCl7XYWbV9V6O">Elli (Female, American)</option>
                            <option value="TxGEqnHWrfWFTfGW9XjX">Josh (Male, American)</option>
                            <option value="VR6AewLTigWG4xSOukaG">Arnold (Male, American)</option>
                            <option value="pNInz6obpgDQGcFmaJgB">Adam (Male, American)</option>
                        </select>
                    </div>
                </div>

                {/* Call Settings */}
                <div className="card settings-section">
                    <h2>📞 Call Settings</h2>

                    <div className="form-group">
                        <label>Max Concurrent Calls</label>
                        <input
                            type="number"
                            value={settings.maxConcurrentCalls}
                            onChange={(e) => updateSetting('maxConcurrentCalls', parseInt(e.target.value))}
                            min={1}
                            max={20}
                        />
                        <small>Maximum number of simultaneous calls</small>
                    </div>

                    <div className="form-group toggle-row">
                        <div className="toggle-info">
                            <label>Call Recording</label>
                            <small>Record all calls for quality assurance</small>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.callRecording}
                                onChange={(e) => updateSetting('callRecording', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-group toggle-row">
                        <div className="toggle-info">
                            <label>Analytics Tracking</label>
                            <small>Track call metrics and AI performance</small>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.analyticsEnabled}
                                onChange={(e) => updateSetting('analyticsEnabled', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Integrations */}
                <div className="card settings-section">
                    <h2>🔗 Integrations</h2>

                    <div className="form-group">
                        <label>Webhook URL (Optional)</label>
                        <input
                            type="url"
                            value={settings.webhookUrl}
                            onChange={(e) => updateSetting('webhookUrl', e.target.value)}
                            placeholder="https://your-crm.com/webhook"
                        />
                        <small>Receive call events at this URL</small>
                    </div>

                    <div className="integration-status">
                        <div className="integration-item">
                            <span className="integration-icon">🟢</span>
                            <span className="integration-name">Asterisk PBX</span>
                            <span className="integration-badge connected">Connected</span>
                        </div>
                        <div className="integration-item">
                            <span className="integration-icon">🟢</span>
                            <span className="integration-name">Supabase</span>
                            <span className="integration-badge connected">Connected</span>
                        </div>
                        <div className="integration-item">
                            <span className="integration-icon">🟡</span>
                            <span className="integration-name">ElevenLabs</span>
                            <span className="integration-badge">{settings.elevenLabsApiKey ? 'Configured' : 'Not Set'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save Settings'}
                </button>
            </div>

            <style>{`
        .settings-page {
          max-width: 900px;
        }
        
        .page-subtitle {
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        
        .message-banner {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        
        .message-banner.success {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .message-banner.error {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        
        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .settings-section h2 {
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }
        
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          background: var(--bg-input);
          border: 1px solid transparent;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent);
        }
        
        .form-group small {
          display: block;
          margin-top: 0.5rem;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        
        .api-key-input {
          display: flex;
          gap: 0.5rem;
        }
        
        .api-key-input input {
          flex: 1;
        }
        
        .api-key-input .btn-icon {
          background: var(--bg-input);
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
        }
        
        .toggle-row:last-child {
          border-bottom: none;
        }
        
        .toggle-info label {
          margin-bottom: 0.25rem;
        }
        
        .toggle-info small {
          margin-top: 0;
        }
        
        .toggle {
          position: relative;
          width: 48px;
          height: 24px;
          flex-shrink: 0;
        }
        
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg-input);
          border-radius: 24px;
          transition: 0.3s;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
        }
        
        .toggle input:checked + .toggle-slider {
          background: var(--accent);
        }
        
        .toggle input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
        
        .integration-status {
          margin-top: 1rem;
        }
        
        .integration-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-input);
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }
        
        .integration-name {
          flex: 1;
        }
        
        .integration-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background: var(--bg-card);
        }
        
        .integration-badge.connected {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .settings-actions {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
        </div>
    );
}

export default Settings;
