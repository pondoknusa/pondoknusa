import { registerIsland } from './island-registry.js';
import type { IslandMountFn } from './types.js';

export interface ProgrammaticIslandModule {
  mount?: IslandMountFn;
}

export function registerProgrammaticIsland(
  id: string,
  module: ProgrammaticIslandModule,
): void {
  if (!module.mount) {
    throw new Error(
      `Programmatic island "${id}" must export a mount(context) function.`,
    );
  }

  registerIsland(id, module.mount);
}

export function registerProgrammaticIslands(
  modules: Record<string, ProgrammaticIslandModule>,
): void {
  for (const [id, module] of Object.entries(modules)) {
    registerProgrammaticIsland(id, module);
  }
}