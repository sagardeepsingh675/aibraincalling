import { createLogger } from '../utils/logger.js';
import { SupabaseService, VCLead } from './SupabaseService.js';
import { config } from '../config/index.js';

const logger = createLogger('CallOrchestrator');

type CallState =
    | 'idle'
    | 'queued'
    | 'initiating'
    | 'ringing'
    | 'connected'
    | 'greeting'
    | 'listening'
    | 'processing'
    | 'speaking'
    | 'ending'
    | 'completed'
    | 'failed';

type ActiveCall = {
    callId: string;
    leadId: string;
    state: CallState;
    startTime: Date;
};

export class CallOrchestrator {
    private supabase: SupabaseService;
    private activeCalls: Map<string, ActiveCall>;

    constructor() {
        this.supabase = new SupabaseService();
        this.activeCalls = new Map();
    }

    /**
     * Queue a new call for processing (called from webhook)
     */
    async queueCall(lead: { leadId: string; name: string; phone: string }): Promise<void> {
        logger.info({ leadId: lead.leadId, name: lead.name }, 'Queueing call for lead');

        // Check calling hours
        if (!this.isWithinCallingHours()) {
            logger.warn({ leadId: lead.leadId }, 'Outside calling hours, will call later');
            // In production, add to Redis queue for later processing
            return;
        }

        // Check concurrent call limit
        if (this.activeCalls.size >= config.calling.maxConcurrent) {
            logger.warn({ leadId: lead.leadId }, 'Max concurrent calls reached, queueing');
            return;
        }

        // Initiate call immediately
        await this.initiateCall(lead.leadId);
    }

    /**
     * Initiate a call to a lead
     */
    async initiateCall(leadId: string): Promise<{ callId: string }> {
        logger.info({ leadId }, 'Initiating call');

        // Get lead details from database
        const lead = await this.supabase.getLead(leadId);
        if (!lead) {
            throw new Error(`Lead not found: ${leadId}`);
        }

        // Verify consent
        if (!lead.consent_given) {
            throw new Error('Lead has not given consent');
        }

        // Get active agent
        const agent = await this.supabase.getActiveAgent();
        if (!agent) {
            logger.warn('No active agent found, using default');
        }

        // Create call record
        const callId = await this.supabase.createCall(leadId, agent?.id);

        // Track active call
        this.activeCalls.set(callId, {
            callId,
            leadId,
            state: 'initiating',
            startTime: new Date(),
        });

        // Update lead status
        await this.supabase.updateLeadStatus(leadId, 'calling');

        // Log call initiation
        await this.supabase.addCallLog(callId, 'system', `Call initiated to ${lead.name} at ${lead.phone}`);

        logger.info({ callId, leadId, phone: lead.phone }, 'Call initiated successfully');

        // TODO: In Phase 8, integrate with Asterisk ARI to make actual call
        // await this.asteriskService.originateCall(callId, lead.phone);

        return { callId };
    }

    /**
     * Handle call answered (webhook from Asterisk)
     */
    async onCallAnswered(callId: string): Promise<void> {
        logger.info({ callId }, 'Call answered');

        const activeCall = this.activeCalls.get(callId);
        if (activeCall) {
            activeCall.state = 'connected';
        }

        await this.supabase.updateCallStatus(callId, 'in_progress');
        await this.supabase.addCallLog(callId, 'system', 'Call connected');

        // Start conversation loop
        // In Phase 5+, this will trigger AI greeting
    }

    /**
     * Handle call ended (webhook from Asterisk)
     */
    async onCallEnded(callId: string, status: 'completed' | 'failed', duration?: number): Promise<void> {
        logger.info({ callId, status, duration }, 'Call ended');

        const activeCall = this.activeCalls.get(callId);
        if (activeCall) {
            // Update lead status based on call outcome
            const lead = await this.supabase.getLead(activeCall.leadId);
            if (lead) {
                await this.supabase.updateLeadStatus(activeCall.leadId, status);
            }
        }

        await this.supabase.updateCallStatus(callId, status, duration);
        await this.supabase.addCallLog(callId, 'system', `Call ended: ${status}`);

        this.activeCalls.delete(callId);
    }

    /**
     * Get call status for API
     */
    async getCallStatus(callId: string): Promise<{ state: CallState; duration: number } | null> {
        const activeCall = this.activeCalls.get(callId);

        if (activeCall) {
            const duration = Math.floor((Date.now() - activeCall.startTime.getTime()) / 1000);
            return { state: activeCall.state, duration };
        }

        // Check database for completed calls
        const callData = await this.supabase.getCallWithLead(callId);
        if (callData) {
            return {
                state: callData.call.status as CallState,
                duration: callData.call.duration || 0
            };
        }

        return null;
    }

    /**
     * Check if current time is within calling hours
     */
    private isWithinCallingHours(): boolean {
        const now = new Date();
        const hours = now.getHours();
        const isWithin = hours >= config.calling.hoursStart && hours < config.calling.hoursEnd;

        logger.debug({ hours, start: config.calling.hoursStart, end: config.calling.hoursEnd, isWithin },
            'Checking calling hours');

        return isWithin;
    }

    /**
     * Get active call count for monitoring
     */
    getActiveCallCount(): number {
        return this.activeCalls.size;
    }

    /**
     * Get all active calls for dashboard
     */
    getActiveCalls(): ActiveCall[] {
        return Array.from(this.activeCalls.values());
    }

    /**
     * Force end a call (admin action)
     */
    async forceEndCall(callId: string): Promise<void> {
        logger.warn({ callId }, 'Force ending call');
        await this.onCallEnded(callId, 'failed', 0);

        // TODO: In Phase 8, send hangup command to Asterisk
        // await this.asteriskService.hangup(callId);
    }
}
