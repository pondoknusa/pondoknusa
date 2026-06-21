import type { Model } from './model.js';

export type ModelEventName =
  | 'creating'
  | 'created'
  | 'updating'
  | 'updated'
  | 'deleting'
  | 'deleted'
  | 'restoring'
  | 'restored';

export type ModelEventHandler = (model: Model) => boolean | void | Promise<boolean | void>;

export async function fireModelEvent(
  model: Model,
  event: ModelEventName,
): Promise<boolean> {
  const handler = (model as unknown as Record<string, unknown>)[event];
  if (typeof handler !== 'function') {
    return true;
  }

  const result = await handler.call(model);
  return result !== false;
}