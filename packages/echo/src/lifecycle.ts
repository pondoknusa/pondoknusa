import type { EchoLifecycleCallbacks } from './types.js';

export class LifecycleRegistry {
  private callbacks: EchoLifecycleCallbacks = {};

  set(callbacks: EchoLifecycleCallbacks): void {
    this.callbacks = {
      connected: mergeHandlers(this.callbacks.connected, callbacks.connected),
      disconnected: mergeHandlers(this.callbacks.disconnected, callbacks.disconnected),
      reconnecting: mergeHandlers(this.callbacks.reconnecting, callbacks.reconnecting),
    };
  }

  emit(event: keyof EchoLifecycleCallbacks): void {
    this.callbacks[event]?.();
  }
}

function mergeHandlers(existing?: () => void, next?: () => void): (() => void) | undefined {
  if (!existing) {
    return next;
  }
  if (!next) {
    return existing;
  }

  return () => {
    existing();
    next();
  };
}