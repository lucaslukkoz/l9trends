import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  DB_HOST: requireEnv('DB_HOST'),
  DB_PORT: parseInt(requireEnv('DB_PORT'), 10),
  DB_NAME: requireEnv('DB_NAME'),
  DB_USER: requireEnv('DB_USER'),
  DB_PASSWORD: requireEnv('DB_PASSWORD'),

  REDIS_HOST: requireEnv('REDIS_HOST'),
  REDIS_PORT: parseInt(requireEnv('REDIS_PORT'), 10),

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_REDIRECT_URI: requireEnv('GOOGLE_REDIRECT_URI'),

  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),
} as const;
