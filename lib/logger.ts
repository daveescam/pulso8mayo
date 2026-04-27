// Logger compatible con Edge Runtime y Node.js
// No importa pino directamente para evitar problemas de bundling en Edge

// Detectar si estamos en Edge Runtime
const isEdgeRuntime = typeof (globalThis as { process?: { versions?: { node?: string } } }).process?.versions?.node === 'undefined';

// Logger simple compatible con Edge
const edgeLogger = {
  info: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => console.debug?.(...args) ?? console.log(...args),
  child: (bindings: Record<string, unknown>) => ({
    info: (...args: unknown[]) => console.log(`[${bindings.component}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${bindings.component}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${bindings.component}]`, ...args),
    debug: (...args: unknown[]) => console.debug?.(`[${bindings.component}]`, ...args) ?? console.log(`[${bindings.component}]`, ...args),
  }),
};

// Logger con pino (solo en Node.js)
let nodeLogger: typeof edgeLogger | null = null;

if (!isEdgeRuntime) {
  try {
    // Dynamic import para evitar que el bundler incluya pino en el Edge
    const pino = require('pino');
    nodeLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
        : undefined,
    });
  } catch {
    // Si pino no está disponible, usar el logger de Edge
    nodeLogger = null;
  }
}

// Exportar el logger apropiado según el runtime
export const logger = nodeLogger ?? edgeLogger;

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