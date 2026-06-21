import { evaluateExpression } from './evaluate.js';
import type { ViewContext } from './types.js';

export function isViewEmpty(value: unknown): boolean {
  if (value == null) {
    return true;
  }

  if (value === '') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

export function isViewSet(expression: string, context: ViewContext): boolean {
  const trimmed = expression.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const value = evaluateExpression(trimmed, context);
    return value !== undefined && value !== null;
  } catch {
    return false;
  }
}

export function isIterableEmpty(expression: string, context: ViewContext): boolean {
  const value = evaluateExpression(expression, context);
  if (value == null) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }

  return true;
}