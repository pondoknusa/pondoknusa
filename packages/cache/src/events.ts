export type CacheEventName = 'cache:hit' | 'cache:miss' | 'cache:write';

export interface CacheEventPayload {
  key: string;
  connection?: string;
}

export type CacheEventListener = (payload: CacheEventPayload) => void;

const listeners: Record<CacheEventName, CacheEventListener[]> = {
  'cache:hit': [],
  'cache:miss': [],
  'cache:write': [],
};

export function onCacheEvent(name: CacheEventName, listener: CacheEventListener): () => void {
  listeners[name].push(listener);
  return () => {
    listeners[name] = listeners[name].filter((entry) => entry !== listener);
  };
}

export function emitCacheEvent(name: CacheEventName, payload: CacheEventPayload): void {
  for (const listener of listeners[name]) {
    listener(payload);
  }
}

export function clearCacheEventListeners(): void {
  for (const name of Object.keys(listeners) as CacheEventName[]) {
    listeners[name] = [];
  }
}