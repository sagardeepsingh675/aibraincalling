import { Router, Request, Response } from 'express';
import { WhisperService } from '../../services/WhisperService.js';
import { logger } from '../../utils/logger.js';
import multer from 'multer';

const router = Router();
const stt = new WhisperService();

// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max (Whisper limit)
    },
});

// Extended request interface for multer
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

/**
 * POST /api/stt/transcribe
 * Transcribe uploaded audio file to text
 */
router.post('/transcribe', upload.single('audio'), async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const { language, saveDebug } = req.body;

        logger.info({
            fileSize: req.file.size,
            mimetype: req.file.mimetype,
            language
        }, 'STT transcription request');

        // Optionally save for debugging
        if (saveDebug === 'true') {
            const debugFile = await stt.saveAudioForDebug(
                req.file.buffer,
                `debug_${Date.now()}.wav`
            );
            logger.debug({ debugFile }, 'Audio saved for debugging');
        }

        const result = await stt.transcribe(req.file.buffer, {
            language: language || 'hi'
        });

        res.json({
            success: true,
            text: result.text,
            language: result.language,
            duration: result.duration,
            segments: result.segments,
        });

    } catch (error) {
        logger.error({ error }, 'Error in STT transcription');
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

/**
 * POST /api/stt/translate
 * Translate audio to English
 */
router.post('/translate', upload.single('audio'), async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        logger.info({ fileSize: req.file.size }, 'STT translation request');

        const englishText = await stt.translateToEnglish(req.file.buffer);

        res.json({
            success: true,
            englishText,
        });

    } catch (error) {
        logger.error({ error }, 'Error in STT translation');
        res.status(500).json({ error: 'Failed to translate audio' });
    }
});

/**
 * GET /api/stt/status
 * Check STT service status
 */
router.get('/status', (_req: Request, res: Response) => {
    const configured = stt.isConfigured();

    res.json({
        configured,
        provider: 'OpenAI Whisper',
        supportedFormats: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'],
        maxFileSize: '25MB',
        supportedLanguages: ['hi', 'en', 'auto'],
        hindiPrompt: configured ? stt.getHindiEnglishPrompt() : null,
        message: configured ? 'Ready' : 'Set OPENAI_API_KEY in .env',
    });
});

/**
 * POST /api/stt/test
 * Test transcription with mock mode
 */
router.post('/test', async (_req: Request, res: Response) => {
    try {
        // Create a mock audio buffer for testing
        const mockAudioBuffer = Buffer.alloc(32000); // 1 second of silence

        const result = await stt.transcribe(mockAudioBuffer);

        res.json({
            success: true,
            configured: stt.isConfigured(),
            mockMode: !stt.isConfigured(),
            result: {
                text: result.text,
                language: result.language,
                duration: result.duration,
            },
            note: stt.isConfigured()
                ? 'Using real Whisper API'
                : 'Using mock transcription - set OPENAI_API_KEY for real STT',
        });

    } catch (error) {
        logger.error({ error }, 'Error in STT test');
        res.status(500).json({ error: 'STT test failed' });
    }
});

export default router;
