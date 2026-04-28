export type FormErrors<Field extends string> = Partial<Record<Field, string>>;

export function isBlank(value: string) {
  return value.trim().length === 0;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function parseOptionalNumber(value: number | string) {
  if (value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function hasFormErrors(errors: FormErrors<string>) {
  return Object.keys(errors).length > 0;
}

export function formatFieldErrorId(formId: string, field: string) {
  return `${formId}-${field}-error`;
}
