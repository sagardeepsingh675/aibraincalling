import { Router } from 'express';
import { VertexAIService } from '../../services/VertexAIService.js';
import { logger } from '../../utils/logger.js';

const router = Router();
const vertexAI = new VertexAIService();

/**
 * POST /api/ai/chat
 * Test AI conversation (for development/testing)
 */
router.post('/chat', async (req, res) => {
    try {
        const { sessionId, message } = req.body;

        if (!sessionId || !message) {
            return res.status(400).json({ error: 'sessionId and message are required' });
        }

        logger.info({ sessionId, message: message.substring(0, 50) }, 'AI chat request');

        const response = await vertexAI.generateResponse(sessionId, message);

        res.json({
            sessionId,
            userMessage: message,
            aiResponse: response,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error }, 'Error in AI chat');
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

/**
 * GET /api/ai/greeting
 * Get AI greeting for a call
 */
router.get('/greeting', (req, res) => {
    const { name } = req.query;
    const greeting = vertexAI.getGreeting(name as string | undefined);
    res.json({ greeting });
});

/**
 * GET /api/ai/closing
 * Get AI closing message
 */
router.get('/closing', (req, res) => {
    const closing = vertexAI.getClosing();
    res.json({ closing });
});

/**
 * GET /api/ai/history/:sessionId
 * Get conversation history for a session
 */
router.get('/history/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const history = vertexAI.getHistory(sessionId);
    res.json({ sessionId, history });
});

/**
 * DELETE /api/ai/session/:sessionId
 * Clear conversation session
 */
router.delete('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    vertexAI.clearConversation(sessionId);
    res.json({ success: true, message: 'Session cleared' });
});

export default router;
