function Agents() {
    return (
        <div className="agents-page">
            <div className="page-header">
                <h1 className="page-title">AI Agents</h1>
                <button className="btn btn-primary">+ Create Agent</button>
            </div>

            <div className="agents-grid">
                <div className="card agent-card">
                    <div className="agent-header">
                        <div className="agent-avatar">🤖</div>
                        <div className="agent-status online"></div>
                    </div>
                    <h3>Main Sales Agent</h3>
                    <p className="agent-description">Hindi-English conversational agent for sales calls</p>

                    <div className="agent-meta">
                        <div className="meta-item">
                            <span className="meta-label">Voice</span>
                            <span className="meta-value">ElevenLabs - Hindi Female</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Calls Today</span>
                            <span className="meta-value">156</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Success Rate</span>
                            <span className="meta-value">92%</span>
                        </div>
                    </div>

                    <div className="agent-actions">
                        <button className="btn btn-primary">Configure</button>
                        <button className="btn">View Logs</button>
                    </div>
                </div>
            </div>

            <style>{`
        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        
        .agent-card {
          text-align: center;
        }
        
        .agent-header {
          position: relative;
          display: inline-block;
          margin-bottom: 1rem;
        }
        
        .agent-avatar {
          font-size: 3rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
          padding: 1rem;
          border-radius: 50%;
        }
        
        .agent-status {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid var(--bg-card);
        }
        
        .agent-status.online { background: #10b981; }
        .agent-status.offline { background: #64748b; }
        
        .agent-card h3 {
          margin-bottom: 0.5rem;
        }
        
        .agent-description {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
        
        .agent-meta {
          background: var(--bg-input);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .meta-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .meta-item:last-child { border-bottom: none; }
        
        .meta-label {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        
        .meta-value {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .agent-actions {
          display: flex;
          gap: 0.75rem;
        }
        
        .agent-actions .btn { flex: 1; }
      `}</style>
        </div>
    );
}

export default Agents;
