import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from './compiler.js';
import { discoverViewNames } from './compiled-cache.js';
import type { ComponentCatalogEntry } from './component-catalog.js';
import { buildComponentCatalog } from './component-catalog.js';
import type { TemplateOp, ViewConfig } from './types.js';

export interface IslandCatalogEntry {
  id: string;
  /** View templates that declare this island id. */
  views: string[];
  /** Client mount file when present (`resources/client/islands/<id>.ts`). */
  clientPath?: string;
  /** Programmatic island view when present (`*.tyr.ts`). */
  programmaticPath?: string;
  hasClientMount: boolean;
  hasProgrammaticMount: boolean;
}

export interface ViewCatalog {
  components: ComponentCatalogEntry[];
  islands: IslandCatalogEntry[];
}

export async function buildViewCatalog(
  basePath: string,
  config: ViewConfig,
  namespaces: ReadonlyMap<string, string> = new Map(),
): Promise<ViewCatalog> {
  return {
    components: await buildComponentCatalog(basePath, config, namespaces),
    islands: await buildIslandCatalog(basePath, config),
  };
}

export async function buildIslandCatalog(
  basePath: string,
  config: ViewConfig,
): Promise<IslandCatalogEntry[]> {
  const extension = config.extension ?? '.tyr';
  const programmaticExtension = config.programmaticExtension ?? '.tyr.ts';
  const viewsRoot = join(basePath, config.path);
  const byId = new Map<string, IslandCatalogEntry>();

  for (const relative of await discoverViewNames(viewsRoot, extension)) {
    const viewName = relative.replace(/\//g, '.');
    const path = join(viewsRoot, `${relative.replace(/\./g, '/')}${extension}`);
    collectIslandsFromView(viewName, path, byId);
  }

  for (const relative of await discoverViewNames(viewsRoot, programmaticExtension)) {
    const path = join(viewsRoot, `${relative.replace(/\./g, '/')}${programmaticExtension}`);
    const id = relative.split('.').pop() ?? relative;
    const entry = ensureIslandEntry(byId, id);
    entry.programmaticPath = normalizePath(path);
    entry.hasProgrammaticMount = hasProgrammaticMountExport(path);
  }

  const clientRoot = join(basePath, 'resources/client/islands');
  if (existsSync(clientRoot)) {
    for (const file of await discoverViewNames(clientRoot, '.ts')) {
      const id = file.split('/').pop() ?? file;
      const path = join(clientRoot, `${file.replace(/\./g, '/')}.ts`);
      const entry = ensureIslandEntry(byId, id);
      entry.clientPath = normalizePath(path);
      entry.hasClientMount = hasRegisterIslandCall(path, id);
    }
  }

  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function collectIslandsFromView(
  viewName: string,
  path: string,
  byId: Map<string, IslandCatalogEntry>,
): void {
  const source = readFileSync(path, 'utf8');
  const template = compile(source, { viewPath: path });
  collectIslandIds(template.ops, viewName, byId);
}

function collectIslandIds(
  ops: TemplateOp[],
  viewName: string,
  byId: Map<string, IslandCatalogEntry>,
): void {
  for (const op of ops) {
    if (op.type === 'island') {
      const entry = ensureIslandEntry(byId, op.id);
      if (!entry.views.includes(viewName)) {
        entry.views.push(viewName);
      }
      collectIslandIds(op.body, viewName, byId);
      continue;
    }

    if ('body' in op && Array.isArray(op.body)) {
      collectIslandIds(op.body, viewName, byId);
    }
    if (op.type === 'forelse') {
      collectIslandIds(op.emptyBody, viewName, byId);
    }
    if (op.type === 'switch') {
      for (const switchCase of op.cases) {
        collectIslandIds(switchCase.body, viewName, byId);
      }
      if (op.defaultBody) {
        collectIslandIds(op.defaultBody, viewName, byId);
      }
    }
    if (op.type === 'component') {
      if (op.defaultSlot) {
        collectIslandIds(op.defaultSlot, viewName, byId);
      }
      if (op.namedSlots) {
        for (const slotOps of Object.values(op.namedSlots)) {
          collectIslandIds(slotOps, viewName, byId);
        }
      }
    }
  }
}

function ensureIslandEntry(byId: Map<string, IslandCatalogEntry>, id: string): IslandCatalogEntry {
  const existing = byId.get(id);
  if (existing) {
    return existing;
  }

  const entry: IslandCatalogEntry = {
    id,
    views: [],
    hasClientMount: false,
    hasProgrammaticMount: false,
  };
  byId.set(id, entry);
  return entry;
}

function hasRegisterIslandCall(path: string, id: string): boolean {
  const source = readFileSync(path, 'utf8');
  return new RegExp(`registerIsland\\(\\s*['"]${escapeRegExp(id)}['"]`).test(source);
}

function hasProgrammaticMountExport(path: string): boolean {
  const source = readFileSync(path, 'utf8');
  return /\bexport\s+(?:async\s+)?function\s+mount\b/.test(source)
    || /\bexport\s*\{[^}]*\bmount\b/.test(source);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}