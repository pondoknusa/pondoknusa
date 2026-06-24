import type { IslandMountFn } from './types.js';

const registry = new Map<string, IslandMountFn>();

export function registerIsland(id: string, mount: IslandMountFn): void {
  if (!id.trim()) {
    throw new Error('Island id must be a non-empty string.');
  }
  registry.set(id, mount);
}

export function unregisterIsland(id: string): void {
  registry.delete(id);
}

export function clearIslands(): void {
  registry.clear();
}

export function getIslandMount(id: string): IslandMountFn | undefined {
  return registry.get(id);
}

export function listRegisteredIslands(): string[] {
  return [...registry.keys()];
}