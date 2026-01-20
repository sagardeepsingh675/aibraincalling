import { Router } from 'express';
import { CallOrchestrator } from '../../services/CallOrchestrator.js';
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
