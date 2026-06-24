import { pathToFileURL } from 'node:url';
import type { ViewContext } from './types.js';

export interface IslandMountTarget {
  querySelector(selectors: string): unknown;
}

export interface IslandMountContext {
  element: IslandMountTarget;
  props: Record<string, unknown>;
  html: string;
}

export type ProgrammaticIslandMountFn = (
  context: IslandMountContext,
) => void | (() => void);

export interface ProgrammaticViewModule {
  render(context: ViewContext): string | Promise<string>;
  mount?: ProgrammaticIslandMountFn;
}

export async function loadProgrammaticView(
  filePath: string,
): Promise<ProgrammaticViewModule> {
  const loaded = await import(pathToFileURL(filePath).href);
  const candidate = (loaded.render ?? loaded.default) as
    | ProgrammaticViewModule['render']
    | undefined;

  if (typeof candidate !== 'function') {
    throw new Error(
      `Programmatic view ${filePath} must export a render(context) function.`,
    );
  }

  const mountCandidate = (loaded.mount ?? (loaded as { default?: { mount?: ProgrammaticIslandMountFn } }).default?.mount) as
    | ProgrammaticIslandMountFn
    | undefined;

  return {
    render: candidate,
    mount: typeof mountCandidate === 'function' ? mountCandidate : undefined,
  };
}