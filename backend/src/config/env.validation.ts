import type ms from 'ms';

export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: ms.StringValue;
  JWT_REFRESH_EXPIRES_IN: ms.StringValue;
  PORT: number;
  NODE_ENV: NodeEnvironment;
  CORS_ORIGIN?: string;
  BACKEND_PUBLIC_URL?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL: string;
  GROQ_VISION_MODEL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
}

const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_JWT_ACCESS_EXPIRES_IN: ms.StringValue = '15m';
const DEFAULT_JWT_REFRESH_EXPIRES_IN: ms.StringValue = '7d';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_GROQ_VISION_MODEL = 'llama-3.2-90b-vision-preview';

export function validateEnvironment(
  env: Record<string, unknown>,
): EnvironmentVariables {
  return {
    DATABASE_URL: getRequiredString(env, 'DATABASE_URL'),
    JWT_SECRET: getRequiredString(env, 'JWT_SECRET'),
    JWT_ACCESS_EXPIRES_IN: getOptionalDuration(
      env.JWT_ACCESS_EXPIRES_IN,
      'JWT_ACCESS_EXPIRES_IN',
      DEFAULT_JWT_ACCESS_EXPIRES_IN,
    ),
    JWT_REFRESH_EXPIRES_IN: getOptionalDuration(
      env.JWT_REFRESH_EXPIRES_IN,
      'JWT_REFRESH_EXPIRES_IN',
      DEFAULT_JWT_REFRESH_EXPIRES_IN,
    ),
    PORT: getRequiredPort(env, 'PORT'),
    NODE_ENV: getNodeEnvironment(env.NODE_ENV),
    CORS_ORIGIN: getOptionalString(env.CORS_ORIGIN),
    BACKEND_PUBLIC_URL: getOptionalString(env.BACKEND_PUBLIC_URL),
    GROQ_API_KEY: getOptionalString(env.GROQ_API_KEY),
    GROQ_MODEL: getOptionalString(env.GROQ_MODEL) ?? DEFAULT_GROQ_MODEL,
    GROQ_VISION_MODEL:
      getOptionalString(env.GROQ_VISION_MODEL) ?? DEFAULT_GROQ_VISION_MODEL,
    RATE_LIMIT_WINDOW_MS: getOptionalPositiveInteger(
      env.RATE_LIMIT_WINDOW_MS,
      'RATE_LIMIT_WINDOW_MS',
      DEFAULT_RATE_LIMIT_WINDOW_MS,
    ),
    RATE_LIMIT_MAX: getOptionalPositiveInteger(
      env.RATE_LIMIT_MAX,
      'RATE_LIMIT_MAX',
      DEFAULT_RATE_LIMIT_MAX,
    ),
  };
}

function getRequiredString(env: Record<string, unknown>, key: string): string {
  const value = env[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Environment variable ${key} is required`);
  }

  return value;
}

function getRequiredPort(env: Record<string, unknown>, key: string): number {
  const value = Number(env[key]);

  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Environment variable ${key} must be a valid TCP port`);
  }

  return value;
}

function getNodeEnvironment(value: unknown): NodeEnvironment {
  if (value === undefined || value === null || value === '') {
    return 'development';
  }

  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }

  throw new Error('Environment variable NODE_ENV is invalid');
}

function getOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('Optional string environment variables must be strings');
  }

  return value;
}

function getOptionalPositiveInteger(
  value: unknown,
  key: string,
  defaultValue: number,
): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`Environment variable ${key} must be a positive integer`);
  }

  return parsedValue;
}

function getOptionalDuration(
  value: unknown,
  key: string,
  defaultValue: ms.StringValue,
): ms.StringValue {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value !== 'string') {
    throw new Error(`Environment variable ${key} must be a duration string`);
  }

  const normalizedValue = value.trim();

  if (!/^\d+(\s?(ms|s|m|h|d|w|y))?$/i.test(normalizedValue)) {
    throw new Error(`Environment variable ${key} must be a valid duration`);
  }

  return normalizedValue as ms.StringValue;
}
