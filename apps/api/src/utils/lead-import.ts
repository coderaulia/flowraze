import type { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const LEAD_IMPORT_STATUSES = ['new', 'contacted', 'qualified', 'unqualified'] as const;
const MAX_IMPORT_ROWS = 500;

type LeadImportInput = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  companyName?: unknown;
  source?: unknown;
  serviceType?: unknown;
  status?: unknown;
  campaignId?: unknown;
  notes?: unknown;
  rowNumber?: unknown;
};

export type LeadImportError = {
  rowNumber: number;
  email?: string;
  reason: string;
};

export type LeadImportCandidate = {
  rowNumber: number;
  email: string;
  data: Prisma.LeadUncheckedCreateInput;
};

function optionalText(value: unknown, label: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${label} must be text`);
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function requiredText(value: unknown, label: string) {
  const text = optionalText(value, label);
  if (!text) {
    throw new Error(`${label} is required`);
  }

  return text;
}

function normalizeEmail(value: unknown) {
  const email = requiredText(value, 'Email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Email is invalid');
  }

  return email;
}

function normalizeStatus(value: unknown) {
  const status = optionalText(value, 'Status')?.toLowerCase();
  if (!status) {
    return 'new';
  }

  if (!LEAD_IMPORT_STATUSES.includes(status as (typeof LEAD_IMPORT_STATUSES)[number])) {
    throw new Error('Status is invalid');
  }

  return status as (typeof LEAD_IMPORT_STATUSES)[number];
}

function getRowNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;
}

export function buildLeadImportCandidates(value: unknown, ownerId: string) {
  if (!Array.isArray(value)) {
    throw new AppError(400, 'Import rows must be an array');
  }

  if (value.length === 0) {
    throw new AppError(400, 'Import file does not contain any leads');
  }

  if (value.length > MAX_IMPORT_ROWS) {
    throw new AppError(400, `Import is limited to ${MAX_IMPORT_ROWS} leads at a time`);
  }

  const seenEmails = new Set<string>();
  const candidates: LeadImportCandidate[] = [];
  const errors: LeadImportError[] = [];

  value.forEach((rawRow, index) => {
    const row = rawRow as LeadImportInput;
    const rowNumber = getRowNumber(row?.rowNumber, index + 2);

    try {
      if (!rawRow || typeof rawRow !== 'object' || Array.isArray(rawRow)) {
        throw new Error('Row must be an object');
      }

      const email = normalizeEmail(row.email);
      if (seenEmails.has(email)) {
        throw new Error('Email is duplicated in this file');
      }
      seenEmails.add(email);

      candidates.push({
        rowNumber,
        email,
        data: {
          fullName: requiredText(row.fullName, 'Full name'),
          email,
          phone: optionalText(row.phone, 'Phone'),
          companyName: optionalText(row.companyName, 'Company'),
          source: requiredText(row.source, 'Source'),
          serviceType: optionalText(row.serviceType, 'Service'),
          campaignId: optionalText(row.campaignId, 'Campaign'),
          status: normalizeStatus(row.status),
          notes: optionalText(row.notes, 'Notes'),
          ownerId,
        },
      });
    } catch (error) {
      errors.push({
        rowNumber,
        email: typeof row?.email === 'string' ? row.email.trim().toLowerCase() : undefined,
        reason: error instanceof Error ? error.message : 'Row is invalid',
      });
    }
  });

  return {
    candidates,
    errors,
    totalRows: value.length,
  };
}
