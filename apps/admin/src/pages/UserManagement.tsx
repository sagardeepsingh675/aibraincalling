import { useState } from 'react';
import { useTenantUsers, useSIPAccounts, useCallingLimits, TenantUser, SIPAccount, CallingLimits } from '../hooks/useSupabase';

// Simple hash function (for demo - in production use bcrypt on backend)
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
};

// Generate random password
const generatePassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

export default function UserManagement() {
    const { users, loading, createUser, updateUser, deleteUser, fetchUsers } = useTenantUsers();
    const { accounts, createAccount, fetchAccounts } = useSIPAccounts();
    const { limits, createLimits, updateLimits, fetchLimits } = useCallingLimits();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showSIPModal, setShowSIPModal] = useState(false);
    const [showLimitsModal, setShowLimitsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        company: '',
        phone: '',
        role: 'user' as 'user' | 'manager' | 'admin'
    });

    const [sipFormData, setSipFormData] = useState({
        sip_username: '',
        sip_password: '',
        user_id: ''
    });

    const [limitsFormData, setLimitsFormData] = useState({
        daily_call_limit: 100,
        concurrent_call_limit: 5,
        monthly_minutes_limit: 1000
    });

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newUser = await createUser({
                name: formData.name,
                email: formData.email,
                company: formData.company,
                phone: formData.phone,
                role: formData.role,
                password_hash: simpleHash(formData.password),
                is_active: true,
                created_by: null
            });

            await createLimits(newUser.id, {
                daily_call_limit: 100,
                concurrent_call_limit: 5,
                monthly_minutes_limit: 1000
            });

            setShowAddModal(false);
            setFormData({ name: '', email: '', password: '', company: '', phone: '', role: 'user' });
            fetchUsers();
            fetchLimits();
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user');
        }
        setIsSubmitting(false);
    };

    const handleToggleActive = async (user: TenantUser) => {
        try {
            await updateUser(user.id, { is_active: !user.is_active });
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const handleDeleteUser = async (user: TenantUser) => {
        if (confirm(`Are you sure you want to delete ${user.name}? This will also delete their SIP accounts and calling limits.`)) {
            try {
                await deleteUser(user.id);
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const handleCreateSIPAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createAccount({
                sip_username: sipFormData.sip_username,
                sip_password: sipFormData.sip_password || generatePassword(),
                user_id: sipFormData.user_id || null,
                sip_server: 'sip.incallai.online',
                sip_port: 5060,
                is_active: true,
                is_synced_to_asterisk: false,
                last_sync_at: null
            });
            setShowSIPModal(false);
            setSipFormData({ sip_username: '', sip_password: '', user_id: '' });
            fetchAccounts();
        } catch (error) {
            console.error('Error creating SIP account:', error);
            alert('Failed to create SIP account');
        }
        setIsSubmitting(false);
    };

    const handleUpdateLimits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            const existingLimit = limits.find(l => l.user_id === selectedUser.id);
            if (existingLimit) {
                await updateLimits(existingLimit.id, limitsFormData);
            } else {
                await createLimits(selectedUser.id, limitsFormData);
            }
            setShowLimitsModal(false);
            setSelectedUser(null);
            fetchLimits();
        } catch (error) {
            console.error('Error updating limits:', error);
            alert('Failed to update limits');
        }
        setIsSubmitting(false);
    };

    const openLimitsModal = (user: TenantUser) => {
        setSelectedUser(user);
        const userLimits = limits.find(l => l.user_id === user.id);
        if (userLimits) {
            setLimitsFormData({
                daily_call_limit: userLimits.daily_call_limit,
                concurrent_call_limit: userLimits.concurrent_call_limit,
                monthly_minutes_limit: userLimits.monthly_minutes_limit
            });
        } else {
            setLimitsFormData({
                daily_call_limit: 100,
                concurrent_call_limit: 5,
                monthly_minutes_limit: 1000
            });
        }
        setShowLimitsModal(true);
    };

    const getUserSIPAccounts = (userId: string): SIPAccount[] => {
        return accounts.filter(a => a.user_id === userId);
    };

    const getUserLimits = (userId: string): CallingLimits | undefined => {
        return limits.find(l => l.user_id === userId);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(99, 102, 241, 0.3)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>User Management</h1>
                    <p style={{ color: '#94a3b8' }}>Manage tenant users, SIP accounts, and calling limits</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setShowSIPModal(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        📞 Add SIP Account
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        👤 Add User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{users.length}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Users</div>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{users.filter(u => u.is_active).length}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Active Users</div>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{accounts.length}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>SIP Accounts</div>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.1))',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid rgba(236, 72, 153, 0.2)'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔗</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{accounts.filter(a => a.is_synced_to_asterisk).length}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Synced to Asterisk</div>
                </div>
            </div>

            {/* Users Table */}
            <div style={{
                background: 'rgba(26, 26, 46, 0.8)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                marginBottom: '2rem'
            }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>👤 Users</h2>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SIP</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Limits</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No users found. Click "Add User" to create one.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => {
                                const userSIP = getUserSIPAccounts(user.id);
                                const userLimits = getUserLimits(user.id);
                                return (
                                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 600,
                                                    fontSize: '1rem'
                                                }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{user.name}</div>
                                                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div>{user.company || '-'}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{user.phone || '-'}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {userSIP.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                    {userSIP.map(sip => (
                                                        <span key={sip.id} style={{
                                                            padding: '0.25rem 0.5rem',
                                                            background: 'rgba(16, 185, 129, 0.15)',
                                                            color: '#10b981',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            {sip.sip_username}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>No SIP</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {userLimits ? (
                                                <div style={{ fontSize: '0.875rem' }}>
                                                    <div>{userLimits.daily_call_limit} calls/day</div>
                                                    <div style={{ color: '#94a3b8' }}>{userLimits.monthly_minutes_limit} min/month</div>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Not set</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                background: user.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: user.is_active ? '#10b981' : '#ef4444'
                                            }}>
                                                {user.is_active ? '● Active' : '○ Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => openLimitsModal(user)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        background: 'rgba(99, 102, 241, 0.15)',
                                                        color: '#6366f1',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    ⚙️ Limits
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        background: user.is_active ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                        color: user.is_active ? '#f59e0b' : '#10b981',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {user.is_active ? '⏸️ Disable' : '▶️ Enable'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#ef4444',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* SIP Accounts Table */}
            <div style={{
                background: 'rgba(26, 26, 46, 0.8)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>📞 SIP Accounts</h2>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned To</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Server</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No SIP accounts found. Click "Add SIP Account" to create one.
                                </td>
                            </tr>
                        ) : (
                            accounts.map((account) => (
                                <tr key={account.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <code style={{
                                            background: 'rgba(99, 102, 241, 0.2)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace'
                                        }}>
                                            {account.sip_username}
                                        </code>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <code style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace',
                                            filter: 'blur(4px)',
                                            transition: 'filter 0.2s',
                                            cursor: 'pointer'
                                        }}
                                            onMouseEnter={(e) => (e.target as HTMLElement).style.filter = 'none'}
                                            onMouseLeave={(e) => (e.target as HTMLElement).style.filter = 'blur(4px)'}
                                        >
                                            {account.sip_password}
                                        </code>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {account.tenant_user ? (
                                            <span style={{ color: '#6366f1' }}>{account.tenant_user.name}</span>
                                        ) : (
                                            <span style={{ color: '#64748b' }}>Unassigned</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        {account.sip_server}:{account.sip_port}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            background: account.is_synced_to_asterisk ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                            color: account.is_synced_to_asterisk ? '#10b981' : '#f59e0b'
                                        }}>
                                            {account.is_synced_to_asterisk ? '✓ Synced' : '⏳ Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div style={{
                        background: '#1a1a2e',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '480px',
                        width: '100%',
                        margin: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>👤 Add New User</h2>
                        <form onSubmit={handleCreateUser}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Password *</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, password: generatePassword() })}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(99, 102, 241, 0.2)',
                                            color: '#6366f1',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🎲
                                    </button>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Company</label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'manager' | 'admin' })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="user">User</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        opacity: isSubmitting ? 0.5 : 1
                                    }}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add SIP Account Modal */}
            {showSIPModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div style={{
                        background: '#1a1a2e',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '480px',
                        width: '100%',
                        margin: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>📞 Add SIP Account</h2>
                        <form onSubmit={handleCreateSIPAccount}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>SIP Username *</label>
                                <input
                                    type="text"
                                    required
                                    value={sipFormData.sip_username}
                                    onChange={(e) => setSipFormData({ ...sipFormData, sip_username: e.target.value })}
                                    placeholder="e.g. user001"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>SIP Password</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={sipFormData.sip_password}
                                        onChange={(e) => setSipFormData({ ...sipFormData, sip_password: e.target.value })}
                                        placeholder="Leave empty to auto-generate"
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSipFormData({ ...sipFormData, sip_password: generatePassword() })}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(16, 185, 129, 0.2)',
                                            color: '#10b981',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🎲
                                    </button>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Assign to User</label>
                                <select
                                    value={sipFormData.user_id}
                                    onChange={(e) => setSipFormData({ ...sipFormData, user_id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowSIPModal(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        opacity: isSubmitting ? 0.5 : 1
                                    }}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create SIP Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Limits Modal */}
            {showLimitsModal && selectedUser && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div style={{
                        background: '#1a1a2e',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '480px',
                        width: '100%',
                        margin: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            ⚙️ Calling Limits for {selectedUser.name}
                        </h2>
                        <form onSubmit={handleUpdateLimits}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Daily Call Limit</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={limitsFormData.daily_call_limit}
                                    onChange={(e) => setLimitsFormData({ ...limitsFormData, daily_call_limit: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Concurrent Call Limit</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={limitsFormData.concurrent_call_limit}
                                    onChange={(e) => setLimitsFormData({ ...limitsFormData, concurrent_call_limit: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Monthly Minutes Limit</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={limitsFormData.monthly_minutes_limit}
                                    onChange={(e) => setLimitsFormData({ ...limitsFormData, monthly_minutes_limit: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowLimitsModal(false); setSelectedUser(null); }}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        opacity: isSubmitting ? 0.5 : 1
                                    }}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Limits'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                input::placeholder, select option {
                    color: #64748b;
                }
                input:focus, select:focus {
                    outline: none;
                    border-color: #6366f1;
                }
            `}</style>
        </div>
    );
}
