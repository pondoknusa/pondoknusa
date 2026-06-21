import { randomBytes } from 'node:crypto';

const RANDOM_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function slug(value: string, separator = '-'): string {
  const normalized = value.trim().toLowerCase();
  const escaped = escapeRegExp(separator);
  const collapsed = normalized
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`${escaped}+`, 'g'), separator);

  return collapsed.replace(new RegExp(`^${escaped}|${escaped}$`, 'g'), '');
}

export function snakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function camelCase(value: string): string {
  const normalized = value
    .replace(/[-_\s]+(.)?/g, (_, char: string | undefined) =>
      char ? char.toUpperCase() : '',
    )
    .replace(/[^a-zA-Z0-9]/g, '');

  return normalized.replace(/^[A-Z]/, (char) => char.toLowerCase());
}

export function studlyCase(value: string): string {
  const camel = camelCase(value);
  if (!camel) {
    return '';
  }
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function kebabCase(value: string): string {
  return snakeCase(value).replace(/_/g, '-');
}

export function lower(value: string): string {
  return value.toLowerCase();
}

export function upper(value: string): string {
  return value.toUpperCase();
}

export function title(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function random(length = 16): string {
  if (length < 1) {
    return '';
  }

  const bytes = randomBytes(length);
  let result = '';

  for (let index = 0; index < length; index += 1) {
    result += RANDOM_CHARS[bytes[index]! % RANDOM_CHARS.length];
  }

  return result;
}

export const Str = {
  slug,
  snake: snakeCase,
  snakeCase,
  camel: camelCase,
  camelCase,
  studly: studlyCase,
  studlyCase,
  kebab: kebabCase,
  kebabCase,
  lower,
  upper,
  title,
  random,
} as const;