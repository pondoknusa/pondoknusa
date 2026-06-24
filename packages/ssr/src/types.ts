import type { HydrationRoot } from './dom.js';

export interface HydrationIslandPayload {
  id: string;
  html: string;
  props: Record<string, unknown>;
}

export interface HydrationManifestPayload {
  islands: HydrationIslandPayload[];
}

export interface IslandMountContext {
  element: HTMLElement;
  props: Record<string, unknown>;
  html: string;
}

export type IslandMountFn = (context: IslandMountContext) => void | (() => void);

export interface HydrateOptions {
  root?: HydrationRoot;
  manifest?: HydrationManifestPayload;
}

export interface HydrateResult {
  mounted: number;
  skipped: string[];
  teardowns: Array<() => void>;
}

export type { HydrationRoot };