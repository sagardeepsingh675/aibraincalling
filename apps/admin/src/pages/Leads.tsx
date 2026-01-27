import { useState } from 'react';
import { useLeads, VCLead } from '../hooks/useSupabase';

function Leads() {
    const { leads, loading, fetchLeads, addLead, updateLead, deleteLead } = useLeads();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState<VCLead | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const handleSearch = () => {
        fetchLeads({ search: searchQuery, status: statusFilter || undefined });
    };

    const handleFilterChange = (status: string) => {
        setStatusFilter(status);
        fetchLeads({ search: searchQuery, status: status || undefined });
    };

    const openAddModal = () => {
        setEditingLead(null);
        setFormData({ name: '', phone: '', email: '', notes: '' });
        setShowModal(true);
    };

    const openEditModal = (lead: VCLead) => {
        setEditingLead(lead);
        setFormData({
            name: lead.name,
            phone: lead.phone,
            email: lead.email || '',
            notes: lead.notes || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingLead) {
                await updateLead(editingLead.id, formData);
            } else {
                await addLead({ ...formData, status: 'pending', consent_given: true });
            }
            setShowModal(false);
        } catch (error) {
            alert('Failed to save lead');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this lead?')) {
            try {
                await deleteLead(id);
            } catch (error) {
                alert('Failed to delete lead');
            }
        }
    };

    const handleCall = async (lead: VCLead) => {
        // TODO: Trigger outbound call via AI Brain API
        alert(`Starting call to ${lead.name} (${lead.phone})...`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'calling': return 'warning';
            case 'failed': case 'no_answer': return 'error';
            default: return 'pending';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="leads-page">
            <div className="page-header">
                <h1 className="page-title">Leads</h1>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={openAddModal}>+ Add Lead</button>
                    <button className="btn">Export CSV</button>
                </div>
            </div>

            <div className="card">
                <div className="table-header">
                    <input
                        type="text"
                        placeholder="Search leads..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="calling">Calling</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="no_answer">No Answer</option>
                    </select>
                    <button className="btn" onClick={handleSearch}>Search</button>
                </div>

                {loading ? (
                    <div className="loading-skeleton">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton-row"></div>
                        ))}
                    </div>
                ) : leads.length === 0 ? (
                    <div className="no-data">
                        <p>No leads found</p>
                        <button className="btn btn-primary" onClick={openAddModal}>Add your first lead</button>
                    </div>
                ) : (
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
                                    <td>{lead.email || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${getStatusBadge(lead.status)}`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td>{formatDate(lead.created_at)}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => handleCall(lead)} title="Call">📞</button>
                                        <button className="btn-icon" onClick={() => openEditModal(lead)} title="Edit">✏️</button>
                                        <button className="btn-icon" onClick={() => handleDelete(lead.id)} title="Delete">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter email"
                            />
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add notes..."
                                rows={3}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving || !formData.name || !formData.phone}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
          transition: opacity 150ms ease, transform 150ms ease;
        }
        
        .btn-icon:hover {
          opacity: 1;
          transform: scale(1.1);
        }
        
        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .skeleton-row {
          height: 50px;
          background: linear-gradient(90deg, var(--bg-input) 25%, var(--bg-card) 50%, var(--bg-input) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .no-data {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
        }
        
        .no-data button {
          margin-top: 1rem;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal {
          background: var(--bg-card);
          border-radius: 12px;
          padding: 2rem;
          width: 100%;
          max-width: 480px;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .modal h2 {
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        
        .form-group input,
        .form-group textarea {
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
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}

export default Leads;
