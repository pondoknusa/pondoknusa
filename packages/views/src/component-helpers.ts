import { escapeHtml } from './escape.js';
import { evaluateExpression } from './evaluate.js';
import type { ViewContext } from './types.js';

export function parsePropsExpression(expression: string): Record<string, unknown> {
  const trimmed = expression.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('[')) {
    return parsePropsArray(trimmed);
  }

  if (trimmed.startsWith('{')) {
    return parsePropsObject(trimmed);
  }

  return {};
}

export function parseAwareExpression(expression: string): string[] {
  const trimmed = expression.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    return parseAwareArray(trimmed);
  }

  if (trimmed.startsWith('{')) {
    const object = parsePropsObject(trimmed);
    return Object.keys(object);
  }

  return [];
}

export function mergeComponentProps(
  defaults: Record<string, unknown> | undefined,
  passed: Record<string, unknown>,
  declaredProps = defaults !== undefined,
): { props: Record<string, unknown>; attributes: Record<string, unknown> } {
  if (!declaredProps) {
    return {
      props: { ...passed },
      attributes: {},
    };
  }

  const declared = new Set(Object.keys(defaults ?? {}));
  const props: Record<string, unknown> = { ...(defaults ?? {}) };
  const attributes: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(passed)) {
    if (declared.has(key)) {
      props[key] = value;
      continue;
    }
    attributes[key] = value;
  }

  return { props, attributes };
}

export function evaluateConditionalMap(
  expression: string,
  context: ViewContext,
): unknown {
  const trimmed = expression.trim();
  if (trimmed.startsWith('[') && trimmed.includes('=>')) {
    return parseConditionalMapArray(trimmed, context);
  }

  return evaluateExpression(trimmed, context);
}

export function renderClassDirective(value: unknown): string {
  const classes = collectClassNames(value);
  return classes.length > 0 ? `class="${escapeHtml(classes.join(' '))}"` : '';
}

export function renderStyleDirective(value: unknown): string {
  const style = collectStyleString(value);
  return style ? `style="${escapeHtml(style)}"` : '';
}

export function mergeClassNames(existing: unknown, incoming: unknown): string {
  const classes = [
    ...collectClassNames(existing),
    ...collectClassNames(incoming),
  ];
  return [...new Set(classes)].join(' ');
}

export function mergeStyleStrings(existing: string, incoming: unknown): string {
  const next = collectStyleString(incoming);
  if (!existing.trim()) {
    return next;
  }
  if (!next) {
    return existing;
  }
  const separator = existing.trimEnd().endsWith(';') ? ' ' : '; ';
  return `${existing.trimEnd()}${separator}${next}`;
}

export function collectClassNames(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectClassNames(entry));
  }

  if (typeof value === 'object') {
    const classes: string[] = [];
    for (const [className, active] of Object.entries(value as Record<string, unknown>)) {
      if (active) {
        classes.push(className);
      }
    }
    return classes;
  }

  return [];
}

export function collectStyleString(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, styleValue]) => styleValue !== false && styleValue != null)
      .map(([property, styleValue]) => `${property}: ${String(styleValue)}`)
      .join('; ');
  }

  return '';
}

function parsePropsArray(source: string): Record<string, unknown> {
  const inner = source.slice(1, -1).trim();
  if (!inner) {
    return {};
  }

  const result: Record<string, unknown> = {};
  for (const item of splitTopLevelCommaList(inner)) {
    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }

    const arrowMatch = trimmed.match(/^['"]([^'"]+)['"]\s*=>\s*(.+)$/);
    if (arrowMatch) {
      result[arrowMatch[1]!] = parseLiteral(arrowMatch[2]!.trim());
      continue;
    }

    const stringMatch = trimmed.match(/^['"]([^'"]+)['"]$/);
    if (stringMatch) {
      result[stringMatch[1]!] = undefined;
    }
  }

  return result;
}

function parseAwareArray(source: string): string[] {
  const inner = source.slice(1, -1).trim();
  if (!inner) {
    return [];
  }

  const keys: string[] = [];
  for (const item of splitTopLevelCommaList(inner)) {
    const stringMatch = item.trim().match(/^['"]([^'"]+)['"]$/);
    if (stringMatch) {
      keys.push(stringMatch[1]!);
    }
  }
  return keys;
}

function parsePropsObject(source: string): Record<string, unknown> {
  try {
    const evaluator = Function(`"use strict"; return (${source});`);
    const value = evaluator();
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

function parseLiteral(source: string): unknown {
  if (/^['"].*['"]$/.test(source)) {
    return source.slice(1, -1);
  }

  if (source === 'true') {
    return true;
  }
  if (source === 'false') {
    return false;
  }
  if (source === 'null') {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(source)) {
    return Number(source);
  }

  try {
    const evaluator = Function(`"use strict"; return (${source});`);
    return evaluator();
  } catch {
    return source;
  }
}

function parseConditionalMapArray(
  source: string,
  context: ViewContext,
): Record<string, unknown> {
  const inner = source.slice(1, -1).trim();
  if (!inner) {
    return {};
  }

  const result: Record<string, unknown> = {};
  for (const item of splitTopLevelCommaList(inner)) {
    const trimmed = item.trim();
    const arrowMatch = trimmed.match(/^['"]([^'"]+)['"]\s*=>\s*(.+)$/);
    if (!arrowMatch) {
      continue;
    }

    result[arrowMatch[1]!] = evaluateExpression(arrowMatch[2]!.trim(), context);
  }

  return result;
}

function splitTopLevelCommaList(source: string): string[] {
  const items: string[] = [];
  let current = '';
  let quote: string | null = null;
  let depth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;

    if (quote) {
      current += char;
      if (char === quote && source[index - 1] !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth -= 1;
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      items.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    items.push(current);
  }

  return items;
}