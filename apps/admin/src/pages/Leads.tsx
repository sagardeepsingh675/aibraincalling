function Leads() {
    // Mock data
    const leads = [
        { id: 1, name: 'Rahul Kumar', phone: '9876543210', email: 'rahul@email.com', status: 'pending', created: '2024-01-19' },
        { id: 2, name: 'Priya Singh', phone: '8765432109', email: 'priya@email.com', status: 'completed', created: '2024-01-19' },
        { id: 3, name: 'Amit Sharma', phone: '7654321098', email: 'amit@email.com', status: 'failed', created: '2024-01-18' },
        { id: 4, name: 'Neha Gupta', phone: '6543210987', email: 'neha@email.com', status: 'calling', created: '2024-01-18' },
    ];

    return (
        <div className="leads-page">
            <div className="page-header">
                <h1 className="page-title">Leads</h1>
                <div className="header-actions">
                    <button className="btn btn-primary">+ Add Lead</button>
                    <button className="btn">Export CSV</button>
                </div>
            </div>

            <div className="card">
                <div className="table-header">
                    <input type="text" placeholder="Search leads..." className="search-input" />
                    <select className="filter-select">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="calling">Calling</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead) => (
                            <tr key={lead.id}>
                                <td>{lead.name}</td>
                                <td>{lead.phone}</td>
                                <td>{lead.email}</td>
                                <td>
                                    <span className={`badge badge-${lead.status === 'completed' ? 'success' : lead.status === 'calling' ? 'warning' : lead.status === 'failed' ? 'error' : 'pending'}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td>{lead.created}</td>
                                <td>
                                    <button className="btn-icon">📞</button>
                                    <button className="btn-icon">✏️</button>
                                    <button className="btn-icon">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
        .header-actions {
          display: flex;
          gap: 0.75rem;
        }
        
        .table-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .search-input {
          flex: 1;
          padding: 0.625rem 1rem;
          background: var(--bg-input);
          border: none;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        
        .filter-select {
          padding: 0.625rem 1rem;
          background: var(--bg-input);
          border: none;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        
        .btn-icon {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 1rem;
          opacity: 0.6;
          transition: opacity 150ms ease;
        }
        
        .btn-icon:hover {
          opacity: 1;
        }
      `}</style>
        </div>
    );
}

export default Leads;
