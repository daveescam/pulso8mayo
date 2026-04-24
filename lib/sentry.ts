import * as Sentry from '@sentry/nextjs';
import { env } from './env';
import { logger } from './logger';

export async function initSentry() {
    if (!env.SENTRY_DSN) {
        logger.warn('Sentry DSN not configured, error tracking disabled');
        return;
    }

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        
        integrations: [
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
            Sentry.browserTracingIntegration(),
        ],
    });

    logger.info({ environment: process.env.NODE_ENV }, 'Sentry initialized');
}

export { Sentry };