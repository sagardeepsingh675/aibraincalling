import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});

/**
 * GET /api/health/ready
 * Readiness check - verify all dependencies are connected
 */
router.get('/ready', async (req, res) => {
    // TODO: Check database, Redis, Asterisk connections
    const checks = {
        database: true, // Check Supabase connection
        redis: true,    // Check Redis connection
        asterisk: true, // Check Asterisk ARI connection
    };

    const allHealthy = Object.values(checks).every(Boolean);

    res.status(allHealthy ? 200 : 503).json({
        ready: allHealthy,
        checks,
    });
});

export default router;
