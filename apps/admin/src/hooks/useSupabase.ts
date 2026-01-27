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
