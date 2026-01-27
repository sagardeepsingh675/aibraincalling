import { useAgents, VCAgent } from '../hooks/useSupabase';

function Agents() {
  const { agents, loading, updateAgent } = useAgents();

  const handleToggleActive = async (agent: VCAgent) => {
    try {
      await updateAgent(agent.id, { is_active: !agent.is_active });
    } catch (error) {
      alert('Failed to update agent');
    }
  };

  return (
    <div className="agents-page">
      <div className="page-header">
        <h1 className="page-title">AI Agents</h1>
        <button className="btn btn-primary">+ Create Agent</button>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1, 2].map(i => (
            <div key={i} className="card skeleton-card"></div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="card no-data">
          <h3>No Agents Configured</h3>
          <p>Create your first AI agent to start making calls</p>
          <button className="btn btn-primary">+ Create Agent</button>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map((agent) => (
            <div key={agent.id} className={`card agent-card ${agent.is_active ? 'active' : 'inactive'}`}>
              <div className="agent-header">
                <div className="agent-avatar">🤖</div>
                <div className="agent-info">
                  <h3>{agent.name}</h3>
                  <span className={`status-badge ${agent.is_active ? 'online' : 'offline'}`}>
                    {agent.is_active ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={agent.is_active}
                    onChange={() => handleToggleActive(agent)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="agent-details">
                <div className="detail-row">
                  <span className="detail-label">Voice ID</span>
                  <span className="detail-value">{agent.voice_id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">
                    {new Date(agent.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="agent-actions">
                <button className="btn" onClick={() => alert('Agent configuration coming soon!')}>Configure</button>
                <button className="btn btn-primary">Test Call</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .agents-grid, .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .skeleton-card {
          height: 250px;
          background: linear-gradient(90deg, var(--bg-input) 25%, var(--bg-card) 50%, var(--bg-input) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .agent-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .agent-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .agent-card.active {
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .agent-card.inactive {
          opacity: 0.7;
        }
        
        .agent-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .agent-avatar {
          font-size: 2.5rem;
          background: var(--bg-input);
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        
        .agent-info {
          flex: 1;
        }
        
        .agent-info h3 {
          margin: 0 0 0.25rem 0;
        }
        
        .status-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
        }
        
        .status-badge.online {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .status-badge.offline {
          background: var(--bg-input);
          color: var(--text-muted);
        }
        
        .toggle {
          position: relative;
          width: 48px;
          height: 24px;
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
        
        .agent-details {
          background: var(--bg-input);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        
        .detail-row:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        
        .detail-value {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .agent-actions {
          display: flex;
          gap: 0.75rem;
        }
        
        .agent-actions .btn {
          flex: 1;
        }
        
        .no-data {
          text-align: center;
          padding: 3rem;
        }
        
        .no-data h3 {
          margin-bottom: 0.5rem;
        }
        
        .no-data p {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
}

export default Agents;
