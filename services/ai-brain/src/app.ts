import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import webhookRoutes from './api/routes/webhook.js';
import callsRoutes from './api/routes/calls.js';
import healthRoutes from './api/routes/health.js';
import aiRoutes from './api/routes/ai.js';
import ttsRoutes from './api/routes/tts.js';
import sttRoutes from './api/routes/stt.js';
import serverRoutes from './api/routes/server.js';
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
app.use('/api/server', serverRoutes);

// Direct test-call endpoint (also accessible via /api/calls/test-call)
app.post('/api/test-call', async (req, res) => {
    // Forward to calls router
    req.url = '/test-call';
    callsRoutes(req, res, () => { });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server for graceful shutdown
const PORT = config.port;
const server = http.createServer(app);

// Track connections for graceful shutdown
let connections: Set<any> = new Set();

server.on('connection', (conn) => {
    connections.add(conn);
    conn.on('close', () => connections.delete(conn));
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close((err) => {
        if (err) {
            logger.error({ error: err }, 'Error during server close');
            process.exit(1);
        }
        logger.info('Server closed. Exiting...');
        process.exit(0);
    });

    // Force close connections after 5 seconds
    setTimeout(() => {
        logger.warn('Could not close connections in time, forcefully shutting down');
        connections.forEach((conn) => conn.destroy());
        process.exit(1);
    }, 5000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    logger.error({ error: err }, 'Uncaught exception');
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled rejection');
});

// Start server
server.listen(PORT, async () => {
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
