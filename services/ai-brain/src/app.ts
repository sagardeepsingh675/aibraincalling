import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import webhookRoutes from './api/routes/webhook.js';
import callsRoutes from './api/routes/calls.js';
import healthRoutes from './api/routes/health.js';
import aiRoutes from './api/routes/ai.js';
import ttsRoutes from './api/routes/tts.js';
import sttRoutes from './api/routes/stt.js';
import { asteriskARI } from './services/AsteriskARIService.js';
import { audioBridge } from './services/AudioBridgeService.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    logger.info({ method: req.method, path: req.path }, 'Incoming request');
    next();
});

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/stt', sttRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.port;

app.listen(PORT, async () => {
    logger.info(`🚀 AI Brain server running on port ${PORT}`);
    logger.info(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhook`);

    // Connect to Asterisk ARI (non-blocking)
    if (config.asterisk.ariPassword && config.asterisk.ariPassword.length > 0) {
        logger.info('🔗 Connecting to Asterisk ARI...');
        asteriskARI.connect()
            .then((connected) => {
                if (connected) {
                    logger.info('✅ Asterisk ARI connected');
                    // Initialize AudioBridge AFTER ARI is connected
                    audioBridge.initialize();
                    logger.info('✅ AudioBridge ready for calls');
                } else {
                    logger.warn('⚠️ Asterisk ARI connection failed, will retry');
                }
            })
            .catch((err) => {
                logger.error('❌ Asterisk ARI error:', err);
            });
    } else {
        logger.info('📞 Asterisk not configured, skipping ARI connection');
    }
});

export default app;

