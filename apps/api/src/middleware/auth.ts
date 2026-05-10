import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/index.js';
import { AppError } from './errorHandler.js';
import { hashSecret } from '../utils/security.js';
import { getCompanyEntitlements } from '../utils/entitlements.js';


export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  companyId?: string | null;
  authType?: 'jwt' | 'api-key';
}

interface TokenPayload {
  userId: string;
  role: string;
  companyId: string | null;
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
          createdBy: { select: { id: true, role: true, companyId: true, isActive: true } },
        },
      });

      if (!record || !record.createdBy.isActive) {
        return next(new AppError(401, 'Invalid API key'));
      }

      const entitlements = await getCompanyEntitlements(record.companyId);
      if (!entitlements.features.apiKeys) {
        return next(new AppError(403, 'API access is not available on this plan', 'FEATURE_NOT_AVAILABLE'));
      }

      await prisma.apiKey.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date() },
      });

      req.userId = record.createdBy.id;
      req.userRole = record.createdBy.role;
      req.companyId = record.createdBy.companyId;
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, companyId: true, isActive: true },
    });

    if (!user?.isActive) {
      return next(new AppError(401, 'User account is inactive'));
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.companyId = user.companyId;
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

export const requireSuperadmin = () => requireRole('superadmin');
export const requireAdmin = () => requireRole('admin');
export const requireManager = () => requireRole('manager');
export const requireAdminOrManager = () => requireRole('admin', 'manager');

export function requireCompanyMember(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.companyId) {
    return next(new AppError(403, 'No company context'));
  }
  next();
}

export function companyDataScope(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.userRole !== 'superadmin' && !req.companyId) {
    return next(new AppError(403, 'No company context'));
  }
  next();
}
