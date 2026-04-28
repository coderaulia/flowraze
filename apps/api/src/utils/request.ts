import { AppError } from '../middleware/errorHandler.js';

export function requireObjectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(400, 'Request body must be an object');
  }

  return value as Record<string, unknown>;
}

export function requireAtLeastOneField(
  data: Record<string, unknown>,
  message = 'At least one field is required'
) {
  if (Object.keys(data).length === 0) {
    throw new AppError(400, message);
  }
}

export function setIfPresent(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  key: string,
  transform?: (value: unknown) => unknown
) {
  if (!Object.prototype.hasOwnProperty.call(source, key)) {
    return;
  }

  const value = source[key];
  target[key] = transform ? transform(value) : value;
}

export function optionalDate(value: unknown) {
  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new AppError(400, 'Date value must be a string');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'Invalid date value');
  }

  return date;
}

export function requiredDate(value: unknown) {
  if (value === null || value === '') {
    throw new AppError(400, 'Date value is required');
  }

  return optionalDate(value);
}
