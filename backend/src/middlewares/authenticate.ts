import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../auth/jwtService';
import { UnauthorizedError } from '../utils/errors';

export type UserPayload = JwtPayload;

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Support token from query parameter (for <img>, <iframe>, download links)
  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
