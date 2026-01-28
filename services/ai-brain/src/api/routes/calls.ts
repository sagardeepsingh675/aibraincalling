import { Router } from 'express';
import { CallOrchestrator } from '../../services/CallOrchestrator.js';
import { supabaseService } from '../../services/SupabaseService.js';
import { asteriskARI } from '../../services/AsteriskARIService.js';
import { logger } from '../../utils/logger.js';

const router = Router();
const callOrchestrator = new CallOrchestrator();

/**
 * POST /api/calls/initiate
 * Manually initiate a call to a lead
 */
router.post('/initiate', async (req, res) => {
    try {
        const { leadId } = req.body;

        if (!leadId) {
            return res.status(400).json({ error: 'leadId is required' });
        }

        logger.info({ leadId }, 'Manual call initiation requested');

        const result = await callOrchestrator.initiateCall(leadId);

        res.json({ success: true, callId: result.callId });
    } catch (error) {
        logger.error({ error }, 'Error initiating call');
        res.status(500).json({ error: 'Failed to initiate call' });
    }
});

/**
 * POST /api/test-call
 * Initiate a test call to verify AI agent configuration
 */
router.post('/test-call', async (req, res) => {
    try {
        const { caller_id, sip_username } = req.body;

        if (!caller_id && !sip_username) {
            return res.status(400).json({ error: 'caller_id or sip_username is required' });
        }

        logger.info({ caller_id, sip_username }, 'Test call requested');

        // Get the agent config for this user
        let agentConfig = null;
        if (caller_id) {
            agentConfig = await supabaseService.getAgentConfigByCallerId(caller_id);
        } else if (sip_username) {
            agentConfig = await supabaseService.getAgentConfigBySipUsername(sip_username);
        }

        if (!agentConfig) {
            return res.status(404).json({ error: 'No agent config found for this user' });
        }

        // Log the test call
        logger.info({
            agentName: agentConfig.agent_name,
            companyName: agentConfig.company_name,
            voiceId: agentConfig.elevenlabs_voice_id
        }, 'Test call will use this agent config');

        // Return success - actual call would be triggered via ARI in production
        res.json({
            success: true,
            message: 'Test call initiated',
            agentConfig: {
                name: agentConfig.agent_name,
                company: agentConfig.company_name,
                voiceId: agentConfig.elevenlabs_voice_id
            }
        });
    } catch (error) {
        logger.error({ error }, 'Error initiating test call');
        res.status(500).json({ error: 'Failed to initiate test call' });
    }
});

/**
 * GET /api/calls/agent-config/:sipUsername
 * Get the agent configuration for a SIP user
 */
router.get('/agent-config/:sipUsername', async (req, res) => {
    try {
        const { sipUsername } = req.params;

        logger.info({ sipUsername }, 'Fetching agent config for SIP user');

        const agentConfig = await supabaseService.getAgentConfigBySipUsername(sipUsername);

        if (!agentConfig) {
            return res.status(404).json({ error: 'No agent config found' });
        }

        res.json({ success: true, config: agentConfig });
    } catch (error) {
        logger.error({ error }, 'Error fetching agent config');
        res.status(500).json({ error: 'Failed to fetch agent config' });
    }
});

/**
 * GET /api/calls/:callId
 * Get call status and details
 */
router.get('/:callId', async (req, res) => {
    try {
        const { callId } = req.params;

        // TODO: Implement getCallStatus
        // const status = await callOrchestrator.getCallStatus(callId);

        res.json({
            callId,
            status: 'mock_status',
            duration: 0,
        });
    } catch (error) {
        logger.error({ error }, 'Error getting call status');
        res.status(500).json({ error: 'Failed to get call status' });
    }
});

/**
 * POST /api/calls/:callId/hangup
 * Terminate an ongoing call
 */
router.post('/:callId/hangup', async (req, res) => {
    try {
        const { callId } = req.params;

        logger.info({ callId }, 'Hangup requested');

        // TODO: Implement hangupCall
        // await callOrchestrator.hangupCall(callId);

        res.json({ success: true });
    } catch (error) {
        logger.error({ error }, 'Error hanging up call');
        res.status(500).json({ error: 'Failed to hangup call' });
    }
});

export default router;

