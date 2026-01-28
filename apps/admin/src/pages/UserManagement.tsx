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
                ...formData,
                password_hash: simpleHash(formData.password),
                is_active: true,
                created_by: null
            });

            // Create default calling limits for the user
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
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage tenant users, SIP accounts, and calling limits</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSIPModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        + Add SIP Account
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Add User
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SIP Accounts</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limits</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No users found. Click "Add User" to create one.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => {
                                const userSIP = getUserSIPAccounts(user.id);
                                const userLimits = getUserLimits(user.id);
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.company || '-'}</div>
                                            <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {userSIP.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {userSIP.map(sip => (
                                                        <span key={sip.id} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                            {sip.sip_username}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No SIP accounts</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {userLimits ? (
                                                <div className="text-sm">
                                                    <div className="text-gray-900">{userLimits.daily_call_limit} calls/day</div>
                                                    <div className="text-gray-500">{userLimits.monthly_minutes_limit} min/month</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No limits set</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openLimitsModal(user)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Limits
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className={user.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                                                >
                                                    {user.is_active ? 'Disable' : 'Enable'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
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
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">SIP Accounts</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Server</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Synced</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No SIP accounts found. Click "Add SIP Account" to create one.
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{account.sip_username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                                            <span className="blur-sm hover:blur-none transition-all cursor-pointer">
                                                {account.sip_password}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {account.tenant_user ? (
                                                <span className="text-blue-600">{account.tenant_user.name}</span>
                                            ) : (
                                                <span className="text-gray-400">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {account.sip_server}:{account.sip_port}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${account.is_synced_to_asterisk
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {account.is_synced_to_asterisk ? 'Synced' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, password: generatePassword() })}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'manager' | 'admin' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="user">User</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add SIP Account</h2>
                        <form onSubmit={handleCreateSIPAccount} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SIP Username *</label>
                                <input
                                    type="text"
                                    required
                                    value={sipFormData.sip_username}
                                    onChange={(e) => setSipFormData({ ...sipFormData, sip_username: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g. user001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SIP Password</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={sipFormData.sip_password}
                                        onChange={(e) => setSipFormData({ ...sipFormData, sip_password: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Leave empty to auto-generate"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSipFormData({ ...sipFormData, sip_password: generatePassword() })}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to User</label>
                                <select
                                    value={sipFormData.user_id}
                                    onChange={(e) => setSipFormData({ ...sipFormData, user_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">-- Unassigned --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSIPModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Calling Limits for {selectedUser.name}
                        </h2>
                        <form onSubmit={handleUpdateLimits} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Call Limit</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={limitsFormData.daily_call_limit}
                                    onChange={(e) => setLimitsFormData({ ...limitsFormData, daily_call_limit: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concurrent Call Limit</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={limitsFormData.concurrent_call_limit}
                                    onChange={(e) => setLimitsFormData({ ...limitsFormData, concurrent_call_limit: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Minutes Limit</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={limitsFormData.monthly_minutes_limit}
                                    onChange={(e) => setLimitsFormData({ ...limitsFormData, monthly_minutes_limit: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowLimitsModal(false); setSelectedUser(null); }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Limits'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
