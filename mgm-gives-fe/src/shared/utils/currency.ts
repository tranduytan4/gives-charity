import i18n from '@/i18n';

export const formatCurrency = (amount: number, locale?: string): string => {
  const currentLocale = locale || (i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  return `${new Intl.NumberFormat(currentLocale).format(amount)} VND`;
};

export const formatVND = (value: number, locale?: string): string => {
  const currentLocale = locale || (i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  return `${new Intl.NumberFormat(currentLocale).format(value)} VND`;
};

/**
 * Formats a raw number into a compact format using K, M, B, T suffixes.
 */
export const formatCompactNumber = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue < 1000) return value.toString();

  const thresholds = [
    { suffix: 'T', divisor: 1e12, maxDecimals: 2 },
    { suffix: 'B', divisor: 1e9, maxDecimals: 2 },
    { suffix: 'M', divisor: 1e6, maxDecimals: 1 },
    { suffix: 'K', divisor: 1e3, maxDecimals: 1 },
  ];

  for (const { suffix, divisor, maxDecimals } of thresholds) {
    if (absValue >= divisor) {
      const val = value / divisor;
      const formattedVal = val.toFixed(maxDecimals);
      return parseFloat(formattedVal) + suffix;
    }
  }

  return value.toString();
};

/**
 * Formats a raw number with thousand separators based on active locale.
 */
export const formatFullCurrency = (value: number, currency = 'VND', locale?: string): string => {
  const currentLocale = locale || (i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  const formatted = new Intl.NumberFormat(currentLocale).format(value);
  return `${formatted} ${currency}`;
};

/**
 * Formats a currency amount specifically for progress displays.
 */
export const formatProgressCurrency = (amount: number, locale?: string): string => {
  const currentLocale = locale || (i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  const absAmount = Math.abs(amount);
  if (absAmount >= 1e9) {
    const val = amount / 1e9;
    const formattedVal = parseFloat(val.toFixed(2));
    return `${formattedVal}B VND`;
  }
  if (absAmount >= 100_000_000) {
    const val = amount / 1e6;
    const formattedVal = parseFloat(val.toFixed(2));
    return `${formattedVal}M VND`;
  }
  return `${new Intl.NumberFormat(currentLocale).format(amount)} VND`;
};

export const formatProgressCurrencyParts = (
  amount: number,
  locale?: string,
): { number: string; unit: string } => {
  const formatted = formatProgressCurrency(amount, locale);
  const index = formatted.lastIndexOf(' VND');
  if (index !== -1) {
    return {
      number: formatted.substring(0, index),
      unit: 'VND',
    };
  }
  return { number: formatted, unit: '' };
};
