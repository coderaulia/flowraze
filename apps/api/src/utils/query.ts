import type { Request } from 'express';
import { AppError } from '../middleware/errorHandler.js';

type QueryValue = Request['query'][string];

export function getQueryString(value: QueryValue): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' && first.trim() ? first.trim() : undefined;
  }

  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function getQueryNumber(value: QueryValue, label: string): number | undefined {
  const rawValue = getQueryString(value);
  if (!rawValue) return undefined;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new AppError(400, `${label} must be a number`);
  }

  return parsed;
}

export function getQueryDate(value: QueryValue, label: string): Date | undefined {
  const rawValue = getQueryString(value);
  if (!rawValue) return undefined;

  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${label} must be a valid date`);
  }

  return date;
}

export function getQueryBoolean(value: QueryValue, label: string): boolean | undefined {
  const rawValue = getQueryString(value);
  if (!rawValue) return undefined;

  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;

  throw new AppError(400, `${label} must be true or false`);
}
