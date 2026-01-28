import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SupabaseService');

// Voice Calling Lead Type
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

// Voice Calling Call Type
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

// Voice Calling Agent Type
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

export class SupabaseService {
    private client: SupabaseClient;

    constructor() {
        if (!config.supabase.url || !config.supabase.serviceKey) {
            logger.warn('Supabase credentials not configured. Using placeholder.');
        }

        this.client = createClient(
            config.supabase.url || 'https://placeholder.supabase.co',
            config.supabase.serviceKey || 'placeholder'
        );
    }

    /**
     * Get a lead by ID
     */
    async getLead(leadId: string): Promise<VCLead | null> {
        logger.info({ leadId }, 'Fetching lead');

        const { data, error } = await this.client
            .from('vc_leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (error) {
            logger.error({ leadId, error: error.message }, 'Error fetching lead');
            return null;
        }

        return data as VCLead;
    }

    /**
     * Get pending leads for calling
     */
    async getPendingLeads(limit: number = 10): Promise<VCLead[]> {
        const { data, error } = await this.client
            .from('vc_leads')
            .select('*')
            .eq('status', 'pending')
            .eq('consent_given', true)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            logger.error({ error: error.message }, 'Error fetching pending leads');
            return [];
        }

        return data as VCLead[];
    }

    /**
     * Update lead status
     */
    async updateLeadStatus(leadId: string, status: VCLead['status']): Promise<void> {
        const { error } = await this.client
            .from('vc_leads')
            .update({ status })
            .eq('id', leadId);

        if (error) {
            logger.error({ leadId, status, error: error.message }, 'Error updating lead status');
            throw error;
        }

        logger.info({ leadId, status }, 'Lead status updated');
    }

    /**
     * Create a new call record
     */
    async createCall(leadId: string, agentId?: string): Promise<string> {
        const { data, error } = await this.client
            .from('vc_calls')
            .insert({
                lead_id: leadId,
                agent_id: agentId || null,
                status: 'queued',
            })
            .select('id')
            .single();

        if (error) {
            logger.error({ leadId, error: error.message }, 'Error creating call record');
            throw error;
        }

        logger.info({ callId: data.id, leadId }, 'Call record created');
        return data.id;
    }

    /**
     * Update call status
     */
    async updateCallStatus(
        callId: string,
        status: VCCall['status'],
        duration?: number
    ): Promise<void> {
        const updates: Record<string, any> = { status };

        if (status === 'in_progress' && !updates.started_at) {
            updates.started_at = new Date().toISOString();
        }

        if (status === 'completed' || status === 'failed') {
            updates.ended_at = new Date().toISOString();
        }

        if (duration !== undefined) {
            updates.duration = duration;
        }

        const { error } = await this.client
            .from('vc_calls')
            .update(updates)
            .eq('id', callId);

        if (error) {
            logger.error({ callId, status, error: error.message }, 'Error updating call status');
            throw error;
        }

        logger.info({ callId, status }, 'Call status updated');
    }

    /**
     * Add a conversation log entry
     */
    async addCallLog(
        callId: string,
        speaker: 'user' | 'agent' | 'system',
        message: string
    ): Promise<void> {
        const { error } = await this.client
            .from('vc_call_logs')
            .insert({
                call_id: callId,
                speaker,
                message,
            });

        if (error) {
            logger.error({ callId, speaker, error: error.message }, 'Error adding call log');
        }
    }

    /**
     * Get active agent
     */
    async getActiveAgent(): Promise<VCAgent | null> {
        const { data, error } = await this.client
            .from('vc_agents')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error) {
            logger.error({ error: error.message }, 'Error fetching active agent');
            return null;
        }

        return data as VCAgent;
    }

    /**
     * Get user's agent config by SIP username (for multi-tenant AI)
     */
    async getAgentConfigBySipUsername(sipUsername: string): Promise<any | null> {
        logger.info({ sipUsername }, 'Fetching agent config for SIP user');

        // First get the user_id from sip_accounts
        const { data: sipAccount, error: sipError } = await this.client
            .from('sip_accounts')
            .select('user_id, caller_id')
            .eq('sip_username', sipUsername)
            .single();

        if (sipError || !sipAccount?.user_id) {
            logger.warn({ sipUsername }, 'No SIP account or user_id found');
            return null;
        }

        // Get the agent config for this user
        const { data: agentConfig, error: configError } = await this.client
            .from('vc_agent_config')
            .select('*')
            .eq('user_id', sipAccount.user_id)
            .eq('is_active', true)
            .single();

        if (configError || !agentConfig) {
            logger.warn({ sipUsername, userId: sipAccount.user_id }, 'No agent config found for user, using default');
            // Return default config if none found
            return this.getDefaultAgentConfig();
        }

        return agentConfig;
    }

    /**
     * Get user's agent config by caller ID
     */
    async getAgentConfigByCallerId(callerId: string): Promise<any | null> {
        logger.info({ callerId }, 'Fetching agent config for caller ID');

        // First get the user_id from sip_accounts by caller_id
        const { data: sipAccount, error: sipError } = await this.client
            .from('sip_accounts')
            .select('user_id, sip_username')
            .eq('caller_id', callerId)
            .single();

        if (sipError || !sipAccount?.user_id) {
            logger.warn({ callerId }, 'No SIP account found for caller ID');
            return null;
        }

        // Get the agent config for this user
        const { data: agentConfig, error: configError } = await this.client
            .from('vc_agent_config')
            .select('*')
            .eq('user_id', sipAccount.user_id)
            .eq('is_active', true)
            .single();

        if (configError || !agentConfig) {
            logger.warn({ callerId, userId: sipAccount.user_id }, 'No agent config found for user, using default');
            return this.getDefaultAgentConfig();
        }

        return agentConfig;
    }

    /**
     * Get default agent config (for fallback)
     */
    async getDefaultAgentConfig(): Promise<any | null> {
        const { data, error } = await this.client
            .from('vc_agent_config')
            .select('*')
            .eq('is_active', true)
            .is('user_id', null)
            .limit(1)
            .single();

        if (error) {
            // Try to get any active config
            const { data: anyConfig } = await this.client
                .from('vc_agent_config')
                .select('*')
                .eq('is_active', true)
                .limit(1)
                .single();
            return anyConfig;
        }

        return data;
    }

    /**
     * Save recording metadata
     */
    async saveRecording(callId: string, filePath: string, duration: number): Promise<void> {
        const { error } = await this.client
            .from('vc_recordings')
            .insert({
                call_id: callId,
                file_path: filePath,
                duration,
            });

        if (error) {
            logger.error({ callId, filePath, error: error.message }, 'Error saving recording');
        }
    }

    /**
     * Get call with lead info
     */
    async getCallWithLead(callId: string): Promise<{ call: VCCall; lead: VCLead } | null> {
        const { data: call, error: callError } = await this.client
            .from('vc_calls')
            .select('*')
            .eq('id', callId)
            .single();

        if (callError || !call) {
            return null;
        }

        const { data: lead, error: leadError } = await this.client
            .from('vc_leads')
            .select('*')
            .eq('id', call.lead_id)
            .single();

        if (leadError || !lead) {
            return null;
        }

        return { call: call as VCCall, lead: lead as VCLead };
    }

    /**
     * Get the Supabase client for direct queries
     */
    getClient(): SupabaseClient {
        return this.client;
    }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
