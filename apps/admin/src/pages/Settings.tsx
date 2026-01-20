function Settings() {
    return (
        <div className="settings-page">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
            </div>

            <div className="settings-grid">
                <div className="card">
                    <h3>API Configuration</h3>
                    <div className="form-group">
                        <label className="form-label">Supabase URL</label>
                        <input type="text" className="form-input" placeholder="https://xxx.supabase.co" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">ElevenLabs API Key</label>
                        <input type="password" className="form-input" placeholder="••••••••••••" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Google Project ID</label>
                        <input type="text" className="form-input" placeholder="your-project-id" />
                    </div>
                    <button className="btn btn-primary">Save API Settings</button>
                </div>

                <div className="card">
                    <h3>Calling Configuration</h3>
                    <div className="form-group">
                        <label className="form-label">Calling Hours Start</label>
                        <input type="number" className="form-input" min="0" max="23" defaultValue="9" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Calling Hours End</label>
                        <input type="number" className="form-input" min="0" max="23" defaultValue="21" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Concurrent Calls</label>
                        <input type="number" className="form-input" min="1" max="10" defaultValue="5" />
                    </div>
                    <button className="btn btn-primary">Save Call Settings</button>
                </div>

                <div className="card">
                    <h3>Asterisk SIP Server</h3>
                    <div className="form-group">
                        <label className="form-label">Asterisk Host</label>
                        <input type="text" className="form-input" placeholder="localhost" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">ARI Port</label>
                        <input type="number" className="form-input" defaultValue="8088" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">ARI Username</label>
                        <input type="text" className="form-input" placeholder="asterisk" />
                    </div>
                    <button className="btn btn-primary">Save SIP Settings</button>
                </div>
            </div>

            <style>{`
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        
        .settings-grid h3 {
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-input);
          border: 1px solid transparent;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        
        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      `}</style>
        </div>
    );
}

export default Settings;
