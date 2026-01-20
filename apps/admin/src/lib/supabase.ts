import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bhvsmoqsotbfugkbcbns.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
    console.warn('VITE_SUPABASE_ANON_KEY not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Voice Calling Database types (vc_ prefix)
export type VCLead = {
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
};

export type VCCall = {
    id: string;
    lead_id: string;
    agent_id: string | null;
    status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
    started_at: string | null;
    ended_at: string | null;
    duration: number | null;
    asterisk_channel: string | null;
    created_at: string;
};

export type VCAgent = {
    id: string;
    name: string;
    voice_id: string;
    prompt_template: string;
    is_active: boolean;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
};

export type VCCallLog = {
    id: string;
    call_id: string;
    speaker: 'user' | 'agent' | 'system';
    message: string;
    timestamp: string;
};

export type VCRecording = {
    id: string;
    call_id: string;
    file_path: string;
    duration: number | null;
    file_size: number | null;
    created_at: string;
};
