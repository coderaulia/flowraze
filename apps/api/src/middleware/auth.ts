import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface TokenPayload {
  userId: string;
  role: string;
}

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'No token provided'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError(401, 'No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    next(new AppError(401, 'Invalid token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }
    next();
  };
}
