export type DateInput = Date | string | number;

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  locale?: string;
}

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  locale?: string;
}

export interface FormatCurrencyOptions extends Intl.NumberFormatOptions {
  locale?: string;
}

export function toDate(value: DateInput): Date {
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${String(value)}`);
  }
  return parsed;
}

export function formatDate(
  value: DateInput,
  locale: string,
  options: FormatDateOptions = {},
): string {
  const { locale: _locale, ...intlOptions } = options;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...intlOptions,
  }).format(toDate(value));
}

export function formatNumber(
  value: number,
  locale: string,
  options: FormatNumberOptions = {},
): string {
  const { locale: _locale, ...intlOptions } = options;
  return new Intl.NumberFormat(locale, intlOptions).format(value);
}

export function formatCurrency(
  value: number,
  currency: string,
  locale: string,
  options: FormatCurrencyOptions = {},
): string {
  const { locale: _locale, ...intlOptions } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...intlOptions,
  }).format(value);
}