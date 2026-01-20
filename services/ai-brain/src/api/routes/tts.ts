import { Router } from 'express';
import { ElevenLabsService } from '../../services/ElevenLabsService.js';
import { logger } from '../../utils/logger.js';

const router = Router();
const tts = new ElevenLabsService();

/**
 * POST /api/tts/synthesize
 * Convert text to speech and return audio file
 */
router.post('/synthesize', async (req, res) => {
    try {
        const { text, voiceId, save } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'text is required' });
        }

        if (!tts.isConfigured()) {
            return res.status(503).json({
                error: 'ElevenLabs not configured',
                message: 'Set ELEVENLABS_API_KEY in your .env file'
            });
        }

        logger.info({ textLength: text.length, voiceId }, 'TTS synthesis request');

        if (save) {
            // Save to file and return path
            const filename = `tts_${Date.now()}.mp3`;
            const filePath = await tts.textToSpeechFile(text, filename, { voiceId });
            return res.json({ success: true, filePath, filename });
        }

        // Return audio directly
        const audioBuffer = await tts.textToSpeech(text, { voiceId });

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length,
        });
        res.send(audioBuffer);

    } catch (error) {
        logger.error({ error }, 'Error in TTS synthesis');
        res.status(500).json({ error: 'Failed to synthesize speech' });
    }
});

/**
 * GET /api/tts/voices
 * Get available voices
 */
router.get('/voices', async (req, res) => {
    try {
        if (!tts.isConfigured()) {
            // Return recommended voices without API call
            return res.json({
                configured: false,
                recommended: tts.getRecommendedHindiVoices()
            });
        }

        const voices = await tts.getVoices();
        res.json({
            configured: true,
            voices,
            recommended: tts.getRecommendedHindiVoices()
        });

    } catch (error) {
        logger.error({ error }, 'Error fetching voices');
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
});

/**
 * GET /api/tts/status
 * Get TTS service status and quota
 */
router.get('/status', async (req, res) => {
    try {
        const configured = tts.isConfigured();

        if (!configured) {
            return res.json({
                configured: false,
                message: 'Set ELEVENLABS_API_KEY in .env'
            });
        }

        const subscription = await tts.getSubscriptionInfo();

        res.json({
            configured: true,
            subscription,
            recommendedVoices: tts.getRecommendedHindiVoices(),
        });

    } catch (error) {
        logger.error({ error }, 'Error getting TTS status');
        res.status(500).json({ error: 'Failed to get status' });
    }
});

/**
 * POST /api/tts/test
 * Quick test endpoint with sample Hindi text
 */
router.post('/test', async (req, res) => {
    try {
        if (!tts.isConfigured()) {
            return res.status(503).json({
                error: 'ElevenLabs not configured',
                testText: 'Namaste! Main aapka AI assistant hoon.'
            });
        }

        const testText = req.body.text || 'Namaste! Main aapka AI assistant hoon. Aap kaise hain?';

        const filename = `test_${Date.now()}.mp3`;
        const filePath = await tts.textToSpeechFile(testText, filename);

        res.json({
            success: true,
            text: testText,
            filePath,
            filename,
        });

    } catch (error) {
        logger.error({ error }, 'Error in TTS test');
        res.status(500).json({ error: 'TTS test failed' });
    }
});

export default router;
