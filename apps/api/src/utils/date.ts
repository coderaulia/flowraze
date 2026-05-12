export const DATE_RANGES = ['7d', '30d', '90d', '12m', 'all'] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export function parseDateRange(value: unknown): DateRange {
  if (typeof value !== 'string') {
    return '30d'; // Default to monthly
  }

  return DATE_RANGES.includes(value as DateRange)
    ? (value as DateRange)
    : '30d';
}

export function getStartDate(range: DateRange): Date | undefined {
  if (range === 'all') {
    return undefined;
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (range === '7d') {
    startDate.setDate(startDate.getDate() - 6);
    return startDate;
  }

  if (range === '30d') {
    startDate.setDate(startDate.getDate() - 29);
    return startDate;
  }

  if (range === '90d') {
    startDate.setDate(startDate.getDate() - 89);
    return startDate;
  }

  if (range === '12m') {
    startDate.setDate(1);
    startDate.setMonth(startDate.getMonth() - 11);
    return startDate;
  }

  return undefined;
}
