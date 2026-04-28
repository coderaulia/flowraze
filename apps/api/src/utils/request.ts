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

export function requireString(
  source: Record<string, unknown>,
  key: string,
  label = key
) {
  const value = source[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, `${label} is required`);
  }

  return value.trim();
}

export function optionalString(value: unknown) {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'string') {
    throw new AppError(400, 'Value must be a string');
  }

  return value;
}

export function optionalNonEmptyString(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, 'Value must be a non-empty string');
  }

  return value.trim();
}

export function requireNumber(
  source: Record<string, unknown>,
  key: string,
  label = key
) {
  const value = source[key];
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    throw new AppError(400, `${label} must be a number`);
  }

  return parsed;
}

export function optionalNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return value === null ? null : undefined;
  }

  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    throw new AppError(400, 'Value must be a number');
  }

  return parsed;
}

export function optionalEnum<T extends string>(
  values: readonly T[],
  label: string
) {
  return (value: unknown): T | undefined => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string' || !values.includes(value as T)) {
      throw new AppError(400, `${label} is invalid`);
    }

    return value as T;
  };
}

export function requireEnum<T extends string>(
  source: Record<string, unknown>,
  key: string,
  values: readonly T[],
  label = key
) {
  const value = optionalEnum(values, label)(source[key]);

  if (!value) {
    throw new AppError(400, `${label} is required`);
  }

  return value;
}

export function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

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

export function requiredDate(value: unknown): Date {
  if (value === null || value === '') {
    throw new AppError(400, 'Date value is required');
  }

  const date = optionalDate(value);
  if (!date) {
    throw new AppError(400, 'Date value is required');
  }

  return date;
}
