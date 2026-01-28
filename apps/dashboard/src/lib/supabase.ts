import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for dashboard
export interface TenantUser {
    id: string;
    email: string;
    name: string;
    company: string | null;
    phone: string | null;
    is_active: boolean;
    role: 'user' | 'manager' | 'admin';
    created_at: string;
}

export interface SIPAccount {
    id: string;
    user_id: string;
    sip_username: string;
    sip_password: string;
    sip_server: string;
    sip_port: number;
    is_active: boolean;
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
}

export interface UserCall {
    id: string;
    lead_id: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    duration: number | null;
    created_at: string;
}
