import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const KEYS_DIR = path.resolve(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.key');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.key');

/**
 * Generates RSA key pair if they don't already exist.
 * Called once at server startup.
 */
export function ensureKeys(): void {
  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    return;
  }

  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  console.log('Generating RSA key pair for JWT RS256...');

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });

  console.log('RSA key pair generated at backend/keys/');
}

let _privateKey: string | null = null;
let _publicKey: string | null = null;

function getPrivateKey(): string {
  if (!_privateKey) {
    _privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');
  }
  return _privateKey;
}

function getPublicKey(): string {
  if (!_publicKey) {
    _publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8');
  }
  return _publicKey;
}

export interface JwtPayload {
  id: number;
  email: string;
}

/**
 * Signs a JWT token using the private key (RS256).
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verifies a JWT token using the public key (RS256).
 * Returns the decoded payload or throws on invalid/expired token.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getPublicKey(), {
    algorithms: ['RS256'],
  }) as JwtPayload;
}
