/**
 * Audit Logging Utility
 *
 * Writes structured audit entries for sensitive operations such as
 * user role changes, billing overrides, API key management, webhook
 * changes, and superadmin actions.
 */

import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.js';
import prisma from '../prisma/index.js';

export interface AuditEntry {
  companyId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  return req.socket?.remoteAddress ?? undefined;
}

/**
 * Write an audit log entry. Fire-and-forget by default to avoid
 * blocking the request path. Errors are logged but not propagated.
 */
export async function writeAuditLog(req: AuthRequest, entry: Omit<AuditEntry, 'actorId' | 'actorEmail' | 'companyId' | 'ipAddress'> & { companyId?: string | null }) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: entry.companyId ?? req.companyId ?? null,
        actorId: req.userId ?? null,
        actorEmail: null, // Could be enriched if needed
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        details: (entry.details as Prisma.InputJsonValue) ?? undefined,
        ipAddress: getClientIp(req) ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never break the request
    console.warn('[audit] Failed to write audit log:', (error as Error).message);
  }
}
