import i18n from '@/i18n';

/**
 * Formats a number (or numeric string) with commas as thousand separators based on current locale.
 * Example: 50000000 -> "50,000,000" (en) or "50.000.000" (vi)
 */
export const formatNumberWithCommas = (
  value: string | number | null | undefined,
  locale?: string,
): string => {
  if (value === null || value === undefined || value === '') return '';
  const cleanValue = typeof value === 'number' ? value.toString() : value.replace(/\D/g, '');
  if (!cleanValue) return '';
  const currentLocale = locale || (i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  return new Intl.NumberFormat(currentLocale).format(Number.parseInt(cleanValue, 10));
};

/**
 * Strips all non-digit characters from a formatted string and returns an integer.
 * Example: "50,000,000" -> 50000000
 */
export const parseNumberFromCommas = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return null;
  return Number.parseInt(cleanValue, 10);
};

/**
 * Safely parses a date representation from the backend.
 */
export const parseUTCDate = (date: string | number | Date | null | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);

  let dateStr = date.trim();

  const hasTime = dateStr.includes('T') || (dateStr.includes(' ') && /\d{2}:\d{2}/.test(dateStr));
  const hasTimezone = /[Zz]$|GMT|[+-]\d{2}(:?\d{2})?$/.test(dateStr);

  if (hasTime && !hasTimezone) {
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T');
    }
    dateStr = `${dateStr}Z`;
  }

  return new Date(dateStr);
};

/**
 * Formats a date string as a short date respecting active locale.
 * Example: "2026-07-06" -> "06 Jul 2026" (en-US) or "06 thg 7, 2026" (vi-VN)
 */
export const formatDate = (date: string, locale?: string): string => {
  const currentLocale = locale || (i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  return parseUTCDate(date).toLocaleDateString(currentLocale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a date string as a short date with time respecting active locale.
 */
export const formatDateTime = (date: string, locale?: string): string => {
  const currentLocale = locale || (i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  return parseUTCDate(date).toLocaleString(currentLocale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Converts an enum-like value to a readable label.
 * Example: "IN_PROGRESS" -> "In Progress"
 */
export const formatLabel = (value: string): string =>
  value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
