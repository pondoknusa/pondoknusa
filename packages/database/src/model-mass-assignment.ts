import type { ModelStatic } from './model-types.js';

export function filterMassAssignableAttributes(
  model: ModelStatic,
  attributes: Record<string, unknown>,
): Record<string, unknown> {
  const fillable = model.fillable ?? [];
  const guarded = model.guarded ?? ['id'];
  const entries = Object.entries(attributes).filter(([key]) => !isDangerousModelKey(key));

  if (fillable.length > 0) {
    const allowed = new Set(fillable);
    return Object.fromEntries(entries.filter(([key]) => allowed.has(key)));
  }

  if (guarded.length > 0) {
    const blocked = new Set(guarded);
    return Object.fromEntries(entries.filter(([key]) => !blocked.has(key)));
  }

  return Object.fromEntries(entries);
}

export function stripHiddenAttributes(
  model: ModelStatic,
  attributes: Record<string, unknown>,
): Record<string, unknown> {
  const hidden = new Set(model.hidden ?? []);
  if (hidden.size === 0) {
    return { ...attributes };
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (!hidden.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

function isDangerousModelKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}
