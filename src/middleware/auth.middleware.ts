import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type JwtUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET wajib di-set di .env');
  return secret;
}

export function signToken(payload: JwtUser) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '12h' });
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = header.slice('Bearer '.length).trim();
    const decoded = jwt.verify(token, getJwtSecret()) as JwtUser;
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res
      .status(403)
      .json({ success: false, message: 'Forbidden (ADMIN only)' });
  }
  return next();
}

