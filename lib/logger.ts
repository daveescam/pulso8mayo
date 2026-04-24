import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
    : undefined,
});

export const createChildLogger = (component: string) => 
  logger.child({ component });

export const redactedPaths = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

function redactObject(obj: Record<string, unknown>): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => redactObject(item as Record<string, unknown>));
  
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const shouldRedact = redactedPaths.some(path => key.toLowerCase().includes(path.toLowerCase()));
    redacted[key] = shouldRedact ? '[REDACTED]' : redactObject(value as Record<string, unknown>);
  }
  return redacted;
}

export function safeLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: Record<string, unknown>) {
  if (!meta) {
    logger[level](message);
    return;
  }
  logger[level](redactObject(meta) as Record<string, unknown>, message);
}