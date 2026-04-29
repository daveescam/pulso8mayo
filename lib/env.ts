import { z } from 'zod';

// Helper to handle empty strings as undefined
const optionalUrl = () => z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().url().optional()
);

const optionalString = () => z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: optionalUrl(),
  WASENDER_API_KEY: optionalString(),
  WASENDER_API_URL: optionalUrl(),
  WASENDER_WEBHOOK_SECRET: optionalString(),
  R2_ACCOUNT_ID: optionalString(),
  R2_ACCESS_KEY_ID: optionalString(),
  R2_SECRET_ACCESS_KEY: optionalString(),
  R2_BUCKET_NAME: optionalString(),
  R2_PUBLIC_URL: optionalString(),
  UPSTASH_REDIS_REST_URL: optionalUrl(),
  UPSTASH_REDIS_REST_TOKEN: optionalString(),
  UPSTASH_QSTASH_TOKEN: optionalString(),
  NEXT_PUBLIC_APP_URL: optionalUrl(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
  SENTRY_DSN: optionalString(),
  SENTRY_ORG: optionalString(),
  SENTRY_PROJECT: optionalString(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const errors = _env.error.flatten().fieldErrors;
  const messages = Object.entries(errors)
    .flatMap(([key, vals]) => vals?.map(v => `${key}: ${v}`) ?? [])
    .join('\n  ');
  throw new Error(`Invalid environment variables:\n  ${messages}`);
}

export const env = _env.data;

export function requireEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} is required but not set`);
  }
  return value;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}