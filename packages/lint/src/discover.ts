import { dirname, join } from 'node:path';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import {
  listSourceFiles,
  lineNumberAt,
  readSource,
  toProjectRelative,
  type ProjectInfo,
} from './project.js';
import {
  DEFAULT_CSRF_EXCEPT,
  extractCsrfExceptPatterns,
} from './csrf-except.js';

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'any' | 'match' | 'options';

export interface DiscoveredRoute {
  file: string;
  line: number;
  method: HttpMethod;
  path: string;
  fullPath: string;
  name?: string;
  middleware: string[];
  controller?: { ident: string; action: string };
}

export interface DiscoveredImport {
  file: string;
  line: number;
  specifier: string;
  isTypeOnly: boolean;
  isSideEffect: boolean;
  names: string[];
}

export interface ProjectDiscovery {
  project: ProjectInfo;
  entrySource: string | undefined;
  entryRelative: string;
  routeFiles: string[];
  routeSources: Map<string, string>;
  providerFiles: string[];
  providerSources: Map<string, string>;
  routes: DiscoveredRoute[];
  registeredMiddleware: Set<string>;
  throttlePresets: Set<string>;
  oauthRedirectUris: Array<{ provider: string; uri: string; file: string; line: number }>;
  hasAuthServiceProvider: boolean;
  hasSetAuthApplication: boolean;
  hasRegisterHttpMiddleware: boolean;
  hasPrepareHttpServer: boolean;
  hasSetRouteApplication: boolean;
  hasAppBoot: boolean;
  staticRouteImports: Array<{ specifier: string; line: number }>;
  dynamicRouteImportLine: number | undefined;
  registerRoutesExportFiles: string[];
  anonymousCsrfUsages: Array<{ file: string; line: number }>;
  /** Effective CSRF except patterns (defaults or custom from createVerifyCsrfTokenMiddleware). */
  csrfExceptPatterns: string[];
  viewFiles: string[];
  viewSources: Map<string, string>;
  controllerMethods: Map<string, Set<string>>;
  importsByFile: Map<string, DiscoveredImport[]>;
}

const BUILTIN_MIDDLEWARE = new Set([
  'auth',
  'auth:api',
  'auth:oauth',
  'guest',
  'csrf',
  'json',
]);

const HTTP_METHODS = 'get|post|put|patch|delete|any|match|options';
const APP_MIDDLEWARE_RE = /\bapp\.middleware\s*\(\s*(['"])([^'"]+)\1/g;
const THROTTLE_LIMITS_RE = /limits\s*:\s*\{([^}]*)\}/s;
const OAUTH_REDIRECT_RE =
  /redirectUri\s*:\s*(?:process\.env\.\w+\s*\|\|\s*)?(['"])([^'"]+)\1/g;
const CREATE_CSRF_RE = /\bcreate(?:Verify)?Csrf(?:Token)?Middleware\s*\(/g;
const CLASS_METHOD_RE =
  /(?:async\s+)?([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?::\s*[^{;]+)?\s*\{/g;

export { BUILTIN_MIDDLEWARE };

export async function discoverProject(project: ProjectInfo): Promise<ProjectDiscovery> {
  const entrySource = await readSource(project.entryPath);
  const entryRelative = toProjectRelative(project.root, project.entryPath);

  const routesDir = join(project.root, 'src', 'routes');
  const providersDir = join(project.root, 'src', 'providers');
  const controllersDir = join(project.root, 'src', 'controllers');

  const routeFiles = (await pathExists(routesDir))
    ? await listSourceFiles(routesDir)
    : [];
  const providerFiles = (await pathExists(providersDir))
    ? await listSourceFiles(providersDir)
    : [];
  const controllerFiles = (await pathExists(controllersDir))
    ? await listSourceFiles(controllersDir)
    : [];

  const routeSources = new Map<string, string>();
  for (const file of routeFiles) {
    const source = await readSource(file);
    if (source !== undefined) {
      routeSources.set(file, source);
    }
  }

  const providerSources = new Map<string, string>();
  for (const file of providerFiles) {
    const source = await readSource(file);
    if (source !== undefined) {
      providerSources.set(file, source);
    }
  }

  const allSources = new Map<string, string>();
  if (entrySource !== undefined) {
    allSources.set(project.entryPath, entrySource);
  }
  for (const [file, source] of routeSources) {
    allSources.set(file, source);
  }
  for (const [file, source] of providerSources) {
    allSources.set(file, source);
  }

  const registeredMiddleware = new Set<string>(BUILTIN_MIDDLEWARE);
  const anonymousCsrfUsages: Array<{ file: string; line: number }> = [];

  for (const [file, source] of allSources) {
    for (const match of source.matchAll(APP_MIDDLEWARE_RE)) {
      const name = match[2];
      if (name) {
        registeredMiddleware.add(name);
      }
    }

    for (const match of source.matchAll(CREATE_CSRF_RE)) {
      anonymousCsrfUsages.push({
        file: toProjectRelative(project.root, file),
        line: lineNumberAt(source, match.index ?? 0),
      });
    }
  }

  const throttlePresets = await loadThrottlePresets(project.root);
  for (const preset of throttlePresets) {
    registeredMiddleware.add(`throttle:${preset}`);
  }

  const oauthRedirectUris = await loadOauthRedirects(project.root);

  const routes: DiscoveredRoute[] = [];
  const importsByFile = new Map<string, DiscoveredImport[]>();

  for (const [file, source] of routeSources) {
    const relative = toProjectRelative(project.root, file);
    routes.push(...scanRoutes(relative, source));
    importsByFile.set(relative, scanImports(relative, source));
  }

  if (entrySource !== undefined) {
    importsByFile.set(entryRelative, scanImports(entryRelative, entrySource));
  }

  const controllerMethods = new Map<string, Set<string>>();
  for (const file of controllerFiles) {
    const source = await readSource(file);
    if (source === undefined) {
      continue;
    }
    const relative = toProjectRelative(project.root, file);
    controllerMethods.set(relative, scanClassMethods(source));
  }

  const registerRoutesExportFiles = routeFiles
    .filter((file) => {
      const source = routeSources.get(file);
      return source !== undefined && /\bexport\s+function\s+registerRoutes\s*\(/.test(source);
    })
    .map((file) => toProjectRelative(project.root, file));

  const staticRouteImports: Array<{ specifier: string; line: number }> = [];
  let dynamicRouteImportLine: number | undefined;

  if (entrySource !== undefined) {
    for (const match of entrySource.matchAll(
      /^import\s+['"](\.[^'"]*routes[^'"]*)['"]\s*;?/gm,
    )) {
      staticRouteImports.push({
        specifier: match[1] ?? '',
        line: lineNumberAt(entrySource, match.index ?? 0),
      });
    }

    const dynamicMatch = entrySource.match(
      /(?:await\s+)?import\s*\(\s*['"]([^'"]*routes[^'"]*)['"]\s*\)/,
    );
    if (dynamicMatch?.index !== undefined) {
      dynamicRouteImportLine = lineNumberAt(entrySource, dynamicMatch.index);
    }
  }

  const combined = [entrySource ?? '', ...providerSources.values()].join('\n');

  let csrfExceptPatterns: string[] = [...DEFAULT_CSRF_EXCEPT];
  const customExcept = extractCsrfExceptPatterns(combined);
  if (customExcept) {
    csrfExceptPatterns = customExcept;
  }

  const viewDirs = [
    join(project.root, 'resources', 'views'),
    join(project.root, 'views'),
    join(project.root, 'src', 'views'),
  ];
  const viewFilesAbsolute: string[] = [];
  for (const dir of viewDirs) {
    if (await pathExists(dir)) {
      viewFilesAbsolute.push(...(await listSourceFiles(dir, ['.tyr'])));
    }
  }

  const viewSources = new Map<string, string>();
  for (const file of viewFilesAbsolute) {
    const source = await readSource(file);
    if (source !== undefined) {
      viewSources.set(toProjectRelative(project.root, file), source);
    }
  }

  return {
    project,
    entrySource,
    entryRelative,
    routeFiles: routeFiles.map((f) => toProjectRelative(project.root, f)),
    routeSources: new Map(
      [...routeSources.entries()].map(([f, s]) => [toProjectRelative(project.root, f), s]),
    ),
    providerFiles: providerFiles.map((f) => toProjectRelative(project.root, f)),
    providerSources: new Map(
      [...providerSources.entries()].map(([f, s]) => [toProjectRelative(project.root, f), s]),
    ),
    routes,
    registeredMiddleware,
    throttlePresets,
    oauthRedirectUris,
    hasAuthServiceProvider: /\bAuthServiceProvider\b/.test(combined),
    hasSetAuthApplication: /\bsetAuthApplication\s*\(/.test(combined),
    hasRegisterHttpMiddleware: /\bregisterHttpMiddleware\s*\(/.test(combined),
    hasPrepareHttpServer: /\bprepareHttpServer\s*\(/.test(combined),
    hasSetRouteApplication: /\bsetRouteApplication\s*\(/.test(entrySource ?? ''),
    hasAppBoot: /\bawait\s+app\.boot\s*\(/.test(entrySource ?? ''),
    staticRouteImports,
    dynamicRouteImportLine,
    registerRoutesExportFiles,
    anonymousCsrfUsages,
    csrfExceptPatterns,
    viewFiles: [...viewSources.keys()],
    viewSources,
    controllerMethods,
    importsByFile,
  };
}

async function loadThrottlePresets(root: string): Promise<Set<string>> {
  const presets = new Set<string>();
  const candidates = [
    join(root, 'config', 'http.ts'),
    join(root, 'config', 'http.js'),
  ];

  for (const path of candidates) {
    const source = await readSource(path);
    if (source === undefined) {
      continue;
    }

    const limitsMatch = source.match(THROTTLE_LIMITS_RE);
    if (!limitsMatch?.[1]) {
      continue;
    }

    for (const keyMatch of limitsMatch[1].matchAll(/([A-Za-z_][\w]*)\s*:/g)) {
      const key = keyMatch[1];
      if (key) {
        presets.add(key);
      }
    }
  }

  return presets;
}

async function loadOauthRedirects(
  root: string,
): Promise<Array<{ provider: string; uri: string; file: string; line: number }>> {
  const results: Array<{ provider: string; uri: string; file: string; line: number }> = [];
  const candidates = [
    join(root, 'config', 'auth.ts'),
    join(root, 'config', 'auth.js'),
  ];

  for (const path of candidates) {
    const source = await readSource(path);
    if (source === undefined) {
      continue;
    }

    const relative = toProjectRelative(root, path);

    for (const match of source.matchAll(OAUTH_REDIRECT_RE)) {
      const uri = match[2] ?? '';
      const index = match.index ?? 0;
      const before = source.slice(Math.max(0, index - 200), index);
      const providerMatch = [...before.matchAll(/([A-Za-z_][\w]*)\s*:\s*\{/g)].pop();
      const provider = providerMatch?.[1] ?? 'oauth';

      results.push({
        provider,
        uri,
        file: relative,
        line: lineNumberAt(source, index),
      });
    }
  }

  return results;
}

export function scanImports(file: string, source: string): DiscoveredImport[] {
  const imports: DiscoveredImport[] = [];

  for (const match of source.matchAll(
    /^import\s+(type\s+)?(?:(\*\s+as\s+[A-Za-z_][\w]*|[A-Za-z_][\w]*(?:\s*,\s*\{[^}]*\})?|\{[^}]*\})\s+from\s+)?(['"])([^'"]+)\3/gm,
  )) {
    const isTypeOnly = Boolean(match[1]);
    const clause = match[2];
    const specifier = match[4] ?? '';
    const isSideEffect = !clause;
    const names: string[] = [];

    if (clause) {
      const named = clause.match(/\{([^}]*)\}/);
      if (named?.[1]) {
        for (const part of named[1].split(',')) {
          const name = part.trim().split(/\s+as\s+/).pop()?.trim();
          if (name) {
            names.push(name);
          }
        }
      }
      const defaultMatch = clause.match(/^([A-Za-z_][\w]*)/);
      if (defaultMatch?.[1] && !clause.trimStart().startsWith('{') && !clause.includes('*')) {
        names.push(defaultMatch[1]);
      }
    }

    imports.push({
      file,
      line: lineNumberAt(source, match.index ?? 0),
      specifier,
      isTypeOnly,
      isSideEffect,
      names,
    });
  }

  return imports;
}

export function scanRoutes(file: string, source: string): DiscoveredRoute[] {
  const routes: DiscoveredRoute[] = [];
  const prefixStack: string[] = [];
  const middlewareStack: string[][] = [[]];
  let pendingPrefix: string | undefined;
  let pendingMiddleware: string[] = [];
  let lastRoute: DiscoveredRoute | undefined;
  let inRouteChain = false;
  let lastRouteIndex = -1;
  const chainStarters = new Set(['Route', 'routes']);

  for (const groupParam of source.matchAll(/\.group\s*\(\s*\(\s*([A-Za-z_][\w]*)/g)) {
    if (groupParam[1]) {
      chainStarters.add(groupParam[1]);
    }
  }

  const starterPattern = [...chainStarters]
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const tokenRe = new RegExp(
    String.raw`\b(?:${starterPattern})\b|\.prefix\s*\(\s*(['"])([^'"]+)\1\s*\)|\.middleware\s*\(\s*([^)]*)\)|\.group\s*\(|\.(${HTTP_METHODS})\s*\(\s*(['"])([^'"]+)\5|\.name\s*\(\s*(['"])([^'"]+)\7\s*\)|[{}]`,
    'g',
  );

  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(source)) !== null) {
    const text = match[0];
    const index = match.index ?? 0;

    if (chainStarters.has(text)) {
      inRouteChain = true;
      continue;
    }

    if (text.startsWith('.prefix')) {
      if (!inRouteChain) {
        continue;
      }
      pendingPrefix = match[2];
      continue;
    }

    if (text.startsWith('.middleware')) {
      if (!inRouteChain) {
        continue;
      }
      pendingMiddleware = extractMiddlewareAliases(match[3] ?? '');
      continue;
    }

    if (text.startsWith('.group')) {
      if (!inRouteChain) {
        continue;
      }
      if (pendingPrefix) {
        prefixStack.push(pendingPrefix);
        pendingPrefix = undefined;
      }
      middlewareStack.push(pendingMiddleware.length > 0 ? [...pendingMiddleware] : []);
      pendingMiddleware = [];
      inRouteChain = false;
      continue;
    }

    if (text === '{') {
      continue;
    }

    if (text === '}') {
      const slice = source.slice(index, index + 4);
      if (slice.startsWith('})') && (prefixStack.length > 0 || middlewareStack.length > 1)) {
        if (prefixStack.length > 0) {
          prefixStack.pop();
        }
        if (middlewareStack.length > 1) {
          middlewareStack.pop();
        }
      }
      continue;
    }

    if (match[4] && match[6] !== undefined) {
      if (!inRouteChain) {
        continue;
      }

      const method = match[4] as HttpMethod;
      const path = match[6];
      const route: DiscoveredRoute = {
        file,
        line: lineNumberAt(source, index),
        method,
        path,
        fullPath: joinPaths(prefixStack.join('/'), path),
        middleware: unique([...middlewareStack.flat(), ...pendingMiddleware]),
        controller: findControllerNear(source, index),
      };
      routes.push(route);
      lastRoute = route;
      lastRouteIndex = index;
      pendingMiddleware = [];
      pendingPrefix = undefined;
      inRouteChain = false;
      continue;
    }

    if (match[8] && lastRoute && index - lastRouteIndex < 400) {
      lastRoute.name = match[8];
      inRouteChain = false;
    }
  }

  return routes;
}

function findControllerNear(
  source: string,
  routeIndex: number,
): { ident: string; action: string } | undefined {
  const window = source.slice(routeIndex, routeIndex + 200);
  const match = window.match(/\[\s*([A-Za-z_][\w]*)\s*,\s*(['"])([^'"]+)\2\s*(?:,|\])/);
  if (!match?.[1] || !match[3]) {
    return undefined;
  }
  return { ident: match[1], action: match[3] };
}

function extractMiddlewareAliases(raw: string): string[] {
  const aliases: string[] = [];
  for (const match of raw.matchAll(/(['"])([^'"]+)\1/g)) {
    const value = match[2];
    if (value) {
      aliases.push(value);
    }
  }
  return aliases;
}

function joinPaths(...parts: string[]): string {
  const joined = parts
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return `/${joined}`.replace(/\/+/g, '/') || '/';
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function scanClassMethods(source: string): Set<string> {
  const methods = new Set<string>();
  // Find class body
  const classMatch = source.match(/\bexport\s+class\s+[A-Za-z_][\w]*[^{]*\{/);
  if (!classMatch || classMatch.index === undefined) {
    // Also try non-export class
    const alt = source.match(/\bclass\s+[A-Za-z_][\w]*[^{]*\{/);
    if (!alt || alt.index === undefined) {
      return methods;
    }
  }

  for (const match of source.matchAll(CLASS_METHOD_RE)) {
    const name = match[1];
    if (
      name &&
      name !== 'constructor' &&
      name !== 'if' &&
      name !== 'for' &&
      name !== 'while' &&
      name !== 'switch' &&
      name !== 'catch'
    ) {
      methods.add(name);
    }
  }

  return methods;
}

export function resolveControllerFile(
  discovery: ProjectDiscovery,
  routeFile: string,
  ident: string,
): string | undefined {
  const imports = discovery.importsByFile.get(routeFile) ?? [];
  const hit = imports.find((imp) => imp.names.includes(ident));
  if (!hit) {
    return undefined;
  }

  let specifier = hit.specifier;
  if (!specifier.startsWith('.')) {
    return undefined;
  }

  // Normalize .js -> .ts for source projects
  specifier = specifier.replace(/\.js$/, '.ts');
  const base = dirname(join(discovery.project.root, routeFile));
  const absolute = join(base, specifier);
  const relative = toProjectRelative(discovery.project.root, absolute);

  if (discovery.controllerMethods.has(relative)) {
    return relative;
  }

  // Try .js key
  const jsRelative = relative.replace(/\.ts$/, '.js');
  if (discovery.controllerMethods.has(jsRelative)) {
    return jsRelative;
  }

  return relative;
}
