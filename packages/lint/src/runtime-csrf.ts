import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Session } from '@pondoknusa/auth';
import { loadConfig } from '@pondoknusa/config';
import {
  Application,
  AuthServiceProvider,
  ConfigServiceProvider,
  DatabaseServiceProvider,
  HttpKernel,
  setAuthApplication,
  setGateApplication,
  setPasswordApplication,
  setRouteApplication,
  type ServiceProvider,
} from '@pondoknusa/core';
import type { Middleware } from '@pondoknusa/http';
import type { ProjectDiscovery } from './discover.js';
import {
  buildCsrfRuntimeProbes,
  runCsrfRuntimeProbes,
  type RuntimeRequestHandler,
} from './runtime-csrf-probes.js';
import { issueSeverity, resolveLintStrict, type LintIssue, type LintOptions } from './types.js';

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function importAppServiceProvider(
  root: string,
): Promise<Record<string, unknown> | undefined> {
  for (const target of [
    join(root, 'src/providers/app-service-provider.js'),
    join(root, 'src/providers/app-service-provider.ts'),
  ]) {
    if (!(await pathExists(target))) {
      continue;
    }
    return import(pathToFileURL(target).href) as Promise<Record<string, unknown>>;
  }
  return undefined;
}

async function importProjectRoutes(
  root: string,
): Promise<{ registerRoutes?: () => void } | undefined> {
  const candidates = [
    join(root, 'src/routes/index.js'),
    join(root, 'src/routes/index.ts'),
    join(root, 'src/routes/api.js'),
    join(root, 'src/routes/api.ts'),
    join(root, 'src/routes/web.js'),
    join(root, 'src/routes/web.ts'),
  ];

  for (const target of candidates) {
    if (!(await pathExists(target))) {
      continue;
    }
    return import(pathToFileURL(target).href) as Promise<{ registerRoutes?: () => void }>;
  }
  return undefined;
}

/**
 * Boot the project in-process and probe mutating routes for live CSRF behavior.
 * Slow by design — intended for pre-deploy / CI, not every keystroke.
 */
export async function lintCsrfRuntime(
  discovery: ProjectDiscovery,
  options: LintOptions = {},
): Promise<LintIssue[]> {
  const strict = resolveLintStrict(options);

  if (!discovery.hasAuthServiceProvider) {
    return [];
  }

  let handle: RuntimeRequestHandler;
  let liveRoutes: Array<{ method: string; uri: string }>;

  try {
    const booted = await bootProjectKernel(discovery.project.root);
    handle = booted.handle;
    liveRoutes = booted.routes;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      {
        rule: 'csrf-runtime-boot-failed',
        message:
          `Could not boot the application for CSRF request probes: ${message}. ` +
          'Fix boot/config/database so AuthServiceProvider can start, or pass --static-only.',
        severity: issueSeverity('csrf-runtime-boot-failed', strict),
      },
    ];
  }

  const routeSource =
    liveRoutes.length > 0
      ? liveRoutes
      : discovery.routes.map((route) => ({
          method: route.method,
          fullPath: route.fullPath,
        }));

  if (routeSource.length === 0) {
    return [
      {
        rule: 'csrf-runtime-boot-failed',
        message:
          'Application booted but registered 0 routes — cannot probe CSRF. ' +
          'Export registerRoutes() from src/routes/index.ts and call it after boot.',
        severity: issueSeverity('csrf-runtime-boot-failed', strict),
      },
    ];
  }

  const probes = buildCsrfRuntimeProbes(routeSource, discovery.csrfExceptPatterns);
  if (probes.length === 0) {
    return [];
  }

  return runCsrfRuntimeProbes(handle, probes, { strict });
}

async function bootProjectKernel(root: string): Promise<{
  handle: RuntimeRequestHandler;
  routes: Array<{ method: string; uri: string }>;
}> {
  await loadConfig(root);

  const app = new Application(root);
  setRouteApplication(app);
  setAuthApplication(app);
  setGateApplication(app);
  setPasswordApplication(app);

  app.register(ConfigServiceProvider);
  app.register(DatabaseServiceProvider);
  app.register(AuthServiceProvider);

  const providerModule = await importAppServiceProvider(root);
  if (providerModule?.AppServiceProvider) {
    const Provider = providerModule.AppServiceProvider as new (
      application: Application,
    ) => ServiceProvider;
    app.register(Provider);
  }

  // Session stand-in must be registered BEFORE Auth boot so it sits ahead of
  // StartSession/CSRF on routes registered after boot (StartSession reuses existing Session).
  let activeSessionData: Record<string, unknown> = {};
  const lintSessionMiddleware: Middleware = async (request, next) => {
    request.session = new Session('pondoknusa-lint', { ...activeSessionData });
    return next();
  };
  app.use(lintSessionMiddleware);

  await app.boot();

  const routesModule = await importProjectRoutes(root);
  routesModule?.registerRoutes?.();

  const kernel = new HttpKernel(app);
  const listed = app.router().listRoutes();

  const handle: RuntimeRequestHandler = async (method, path, options) => {
    activeSessionData = options?.csrfToken ? { _csrf_token: options.csrfToken } : {};

    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
    };
    if (options?.csrfToken) {
      headers['x-csrf-token'] = options.csrfToken;
    }

    const response = await kernel.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : '{}',
      }),
    );

    return { status: response.status };
  };

  return {
    handle,
    routes: listed.map((route) => ({ method: route.method, uri: route.uri })),
  };
}
