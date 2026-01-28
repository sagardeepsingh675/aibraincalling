import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface VCLead {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    consent_given: boolean;
    consent_timestamp: string | null;
    status: 'pending' | 'calling' | 'completed' | 'failed' | 'no_answer';
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface VCCall {
    id: string;
    lead_id: string;
    agent_id: string | null;
    status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
    started_at: string | null;
    ended_at: string | null;
    duration: number | null;
    asterisk_channel: string | null;
    created_at: string;
    lead?: VCLead;
}

export interface VCAgent {
    id: string;
    name: string;
    voice_id: string;
    prompt_template: string;
    is_active: boolean;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface VCAgentConfig {
    id: string;
    agent_name: string;
    company_name: string;
    voice_style: string;
    language_preference: string;
    greeting_template: string;
    availability_check_script: string;
    pitch_script: string;
    closing_positive: string;
    closing_negative: string;
    positive_keywords: string[];
    negative_keywords: string[];
    max_call_duration: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface VCCallLog {
    id: string;
    call_id: string;
    speaker: 'user' | 'agent' | 'system';
    message: string;
    timestamp: string;
}

// Dashboard Stats Hook
export function useDashboardStats() {
    const [stats, setStats] = useState({
        totalLeads: 0,
        callsToday: 0,
        successRate: 0,
        avgDuration: 0,
        loading: true,
        error: null as string | null,
    });

    const fetchStats = useCallback(async () => {
        try {
            // Get total leads
            const { count: leadCount } = await supabase
                .from('vc_leads')
                .select('*', { count: 'exact', head: true });

            // Get today's calls
            const today = new Date().toISOString().split('T')[0];
            const { data: todayCalls } = await supabase
                .from('vc_calls')
                .select('*')
                .gte('created_at', today);

            // Calculate success rate
            const completedCalls = todayCalls?.filter(c => c.status === 'completed') || [];
            const successRate = todayCalls?.length
                ? Math.round((completedCalls.length / todayCalls.length) * 100)
                : 0;

            // Calculate average duration
            const totalDuration = completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
            const avgDuration = completedCalls.length
                ? Math.round(totalDuration / completedCalls.length)
                : 0;

            setStats({
                totalLeads: leadCount || 0,
                callsToday: todayCalls?.length || 0,
                successRate,
                avgDuration,
                loading: false,
                error: null,
            });
        } catch (error) {
            setStats(prev => ({ ...prev, loading: false, error: 'Failed to load stats' }));
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { ...stats, refetch: fetchStats };
}

// Leads Hook
export function useLeads() {
    const [leads, setLeads] = useState<VCLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeads = useCallback(async (filters?: { status?: string; search?: string }) => {
        setLoading(true);
        try {
            let query = supabase
                .from('vc_leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.search) {
                query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLeads(data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load leads');
        } finally {
            setLoading(false);
        }
    }, []);

    const addLead = async (lead: Partial<VCLead>) => {
        const { data, error } = await supabase
            .from('vc_leads')
            .insert([lead])
            .select()
            .single();
        if (error) throw error;
        setLeads(prev => [data, ...prev]);
        return data;
    };

    const updateLead = async (id: string, updates: Partial<VCLead>) => {
        const { data, error } = await supabase
            .from('vc_leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        setLeads(prev => prev.map(l => l.id === id ? data : l));
        return data;
    };

    const deleteLead = async (id: string) => {
        const { error } = await supabase
            .from('vc_leads')
            .delete()
            .eq('id', id);
        if (error) throw error;
        setLeads(prev => prev.filter(l => l.id !== id));
    };

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    return { leads, loading, error, fetchLeads, addLead, updateLead, deleteLead };
}

// Calls Hook
export function useCalls() {
    const [calls, setCalls] = useState<VCCall[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCalls = useCallback(async (filters?: { status?: string; date?: string }) => {
        setLoading(true);
        try {
            let query = supabase
                .from('vc_calls')
                .select(`
                    *,
                    lead:vc_leads(name, phone, email)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.date) {
                query = query.gte('created_at', filters.date);
            }

            const { data, error } = await query;
            if (error) throw error;
            setCalls(data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load calls');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCalls();
    }, [fetchCalls]);

    return { calls, loading, error, fetchCalls };
}

// Call Logs Hook (Transcript)
export function useCallLogs(callId: string | null) {
    const [logs, setLogs] = useState<VCCallLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!callId) return;

        setLoading(true);
        supabase
            .from('vc_call_logs')
            .select('*')
            .eq('call_id', callId)
            .order('timestamp', { ascending: true })
            .then(({ data }) => {
                setLogs(data || []);
                setLoading(false);
            });
    }, [callId]);

    return { logs, loading };
}

// Agent Config Hook
export function useAgentConfig() {
    const [config, setConfig] = useState<VCAgentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vc_agent_config')
                .select('*')
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setConfig(data);
            setError(null);
        } catch (err) {
            setError('Failed to load config');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveConfig = async (updates: Partial<VCAgentConfig>) => {
        if (config?.id) {
            const { data, error } = await supabase
                .from('vc_agent_config')
                .update(updates)
                .eq('id', config.id)
                .select()
                .single();
            if (error) throw error;
            setConfig(data);
            return data;
        } else {
            const { data, error } = await supabase
                .from('vc_agent_config')
                .insert([{ ...updates, is_active: true }])
                .select()
                .single();
            if (error) throw error;
            setConfig(data);
            return data;
        }
    };

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    return { config, loading, error, saveConfig, refetch: fetchConfig };
}

// Recent Calls Hook (for Dashboard)
export function useRecentCalls(limit = 5) {
    const [calls, setCalls] = useState<VCCall[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('vc_calls')
            .select(`
                *,
                lead:vc_leads(name, phone)
            `)
            .order('created_at', { ascending: false })
            .limit(limit)
            .then(({ data }) => {
                setCalls(data || []);
                setLoading(false);
            });
    }, [limit]);

    return { calls, loading };
}

// Agents Hook
export function useAgents() {
    const [agents, setAgents] = useState<VCAgent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgents = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('vc_agents')
            .select('*')
            .order('created_at', { ascending: false });
        setAgents(data || []);
        setLoading(false);
    }, []);

    const updateAgent = async (id: string, updates: Partial<VCAgent>) => {
        const { data, error } = await supabase
            .from('vc_agents')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        setAgents(prev => prev.map(a => a.id === id ? data : a));
        return data;
    };

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    return { agents, loading, fetchAgents, updateAgent };
}

// ===== TENANT USER MANAGEMENT =====

export interface TenantUser {
    id: string;
    email: string;
    password_hash?: string;
    name: string;
    company: string | null;
    phone: string | null;
    is_active: boolean;
    role: 'user' | 'manager' | 'admin';
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface SIPAccount {
    id: string;
    user_id: string | null;
    sip_username: string;
    sip_password: string;
    sip_server: string;
    sip_port: number;
    is_active: boolean;
    is_synced_to_asterisk: boolean;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
    tenant_user?: TenantUser;
}

export interface CallingLimits {
    id: string;
    user_id: string;
    daily_call_limit: number;
    concurrent_call_limit: number;
    monthly_minutes_limit: number;
    used_minutes_today: number;
    used_minutes_month: number;
    calls_today: number;
    last_reset_date: string;
    created_at: string;
    updated_at: string;
}

// Hook for tenant users
export function useTenantUsers() {
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('tenant_users')
            .select('*')
            .order('created_at', { ascending: false });
        setUsers(data || []);
        setLoading(false);
    }, []);

    const createUser = async (user: Omit<TenantUser, 'id' | 'created_at' | 'updated_at'>) => {
        const { data, error } = await supabase
            .from('tenant_users')
            .insert(user)
            .select()
            .single();
        if (error) throw error;
        setUsers(prev => [data, ...prev]);
        return data;
    };

    const updateUser = async (id: string, updates: Partial<TenantUser>) => {
        const { data, error } = await supabase
            .from('tenant_users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        setUsers(prev => prev.map(u => u.id === id ? data : u));
        return data;
    };

    const deleteUser = async (id: string) => {
        const { error } = await supabase
            .from('tenant_users')
            .delete()
            .eq('id', id);
        if (error) throw error;
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, loading, fetchUsers, createUser, updateUser, deleteUser };
}

// Hook for SIP accounts
export function useSIPAccounts() {
    const [accounts, setAccounts] = useState<SIPAccount[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('sip_accounts')
            .select('*, tenant_user:tenant_users(*)')
            .order('created_at', { ascending: false });
        setAccounts(data || []);
        setLoading(false);
    }, []);

    const createAccount = async (account: Omit<SIPAccount, 'id' | 'created_at' | 'updated_at' | 'tenant_user'>) => {
        const { data, error } = await supabase
            .from('sip_accounts')
            .insert(account)
            .select()
            .single();
        if (error) throw error;
        setAccounts(prev => [data, ...prev]);
        return data;
    };

    const updateAccount = async (id: string, updates: Partial<SIPAccount>) => {
        const { data, error } = await supabase
            .from('sip_accounts')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        setAccounts(prev => prev.map(a => a.id === id ? data : a));
        return data;
    };

    const deleteAccount = async (id: string) => {
        const { error } = await supabase
            .from('sip_accounts')
            .delete()
            .eq('id', id);
        if (error) throw error;
        setAccounts(prev => prev.filter(a => a.id !== id));
    };

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    return { accounts, loading, fetchAccounts, createAccount, updateAccount, deleteAccount };
}

// Hook for calling limits
export function useCallingLimits() {
    const [limits, setLimits] = useState<CallingLimits[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLimits = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('calling_limits')
            .select('*')
            .order('created_at', { ascending: false });
        setLimits(data || []);
        setLoading(false);
    }, []);

    const createLimits = async (userId: string, limitConfig: Partial<CallingLimits>) => {
        const { data, error } = await supabase
            .from('calling_limits')
            .insert({ user_id: userId, ...limitConfig })
            .select()
            .single();
        if (error) throw error;
        setLimits(prev => [data, ...prev]);
        return data;
    };

    const updateLimits = async (id: string, updates: Partial<CallingLimits>) => {
        const { data, error } = await supabase
            .from('calling_limits')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        setLimits(prev => prev.map(l => l.id === id ? data : l));
        return data;
    };

    useEffect(() => {
        fetchLimits();
    }, [fetchLimits]);

    return { limits, loading, fetchLimits, createLimits, updateLimits };
}
