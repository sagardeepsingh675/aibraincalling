import { Router } from 'express';
import { logger } from '../../utils/logger.js';
import { CallOrchestrator } from '../../services/CallOrchestrator.js';

const router = Router();
const callOrchestrator = new CallOrchestrator();

/**
 * POST /api/webhook/lead-created
 * Triggered by Supabase when a new lead is inserted
 */
router.post('/lead-created', async (req, res) => {
    try {
        const { record } = req.body;

        if (!record) {
            return res.status(400).json({ error: 'Missing record in webhook payload' });
        }

        logger.info({ leadId: record.id, phone: record.phone }, 'Received new lead webhook');

        // Validate required fields
        if (!record.phone || !record.consent_given) {
            logger.warn({ leadId: record.id }, 'Lead missing phone or consent');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Queue the call
        await callOrchestrator.queueCall({
            leadId: record.id,
            name: record.name,
            phone: record.phone,
        });

        res.json({ success: true, message: 'Call queued successfully' });
    } catch (error) {
        logger.error({ error }, 'Error processing lead webhook');
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

/**
 * POST /api/webhook/call-status
 * Updates from Asterisk about call status changes
 */
router.post('/call-status', async (req, res) => {
    try {
        const { callId, status, duration } = req.body;

        logger.info({ callId, status, duration }, 'Call status update');

        // Update call status in database
        // await callOrchestrator.updateCallStatus(callId, status, duration);

        res.json({ success: true });
    } catch (error) {
        logger.error({ error }, 'Error processing call status webhook');
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

export default router;
