export type FormErrors = Record<string, string>;

export function hasFormErrors(errors: FormErrors) {
  return Object.keys(errors).length > 0;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidDateValue(value: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function isNonNegativeNumber(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function isPositiveNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}
