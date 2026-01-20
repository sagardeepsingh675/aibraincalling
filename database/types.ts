// Auto-generated Supabase Types
// Project: ai lead (bhvsmoqsotbfugkbcbns)
// Generated: 2026-01-19

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Voice Calling Platform specific types
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

export type VCAgent = {
    id: string;
    name: string;
    voice_id: string;
    prompt_template: string;
    is_active: boolean;
    settings: Json;
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

// Database schema interface
export interface Database {
    public: {
        Tables: {
            vc_leads: {
                Row: VCLead;
                Insert: Omit<VCLead, 'id' | 'created_at' | 'updated_at'> & { id?: string };
                Update: Partial<VCLead>;
            };
            vc_agents: {
                Row: VCAgent;
                Insert: Omit<VCAgent, 'id' | 'created_at' | 'updated_at'> & { id?: string };
                Update: Partial<VCAgent>;
            };
            vc_calls: {
                Row: VCCall;
                Insert: Omit<VCCall, 'id' | 'created_at'> & { id?: string };
                Update: Partial<VCCall>;
            };
            vc_call_logs: {
                Row: VCCallLog;
                Insert: Omit<VCCallLog, 'id' | 'timestamp'> & { id?: string };
                Update: Partial<VCCallLog>;
            };
            vc_recordings: {
                Row: VCRecording;
                Insert: Omit<VCRecording, 'id' | 'created_at'> & { id?: string };
                Update: Partial<VCRecording>;
            };
        };
    };
}
