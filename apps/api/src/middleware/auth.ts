import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/index.js';
import { AppError } from './errorHandler.js';
import { hashSecret } from '../utils/security.js';


export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  authType?: 'jwt' | 'api-key';
}

interface TokenPayload {
  userId: string;
  role: string;
}

function getApiKey(req: AuthRequest) {
  const headerValue = req.headers['x-api-key'];

  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }

  return headerValue;
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const apiKey = getApiKey(req);

  if (apiKey) {
    try {
      const record = await prisma.apiKey.findFirst({
        where: {
          keyHash: hashSecret(apiKey),
          revokedAt: null,
        },
        include: {
          createdBy: { select: { id: true, role: true } },
        },
      });

      if (!record) {
        return next(new AppError(401, 'Invalid API key'));
      }

      await prisma.apiKey.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date() },
      });

      req.userId = record.createdBy.id;
      req.userRole = record.createdBy.role;
      req.authType = 'api-key';
      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'No token provided'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError(401, 'No token provided'));
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError(500, 'Server configuration error');
    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.authType = 'jwt';
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
