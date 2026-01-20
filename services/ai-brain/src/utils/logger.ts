import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: config.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
        },
    } : undefined,
    redact: ['phone', 'apiKey', 'password', 'secret'],
});

// Create child loggers for different components
export const createLogger = (component: string) => {
    return logger.child({ component });
};
