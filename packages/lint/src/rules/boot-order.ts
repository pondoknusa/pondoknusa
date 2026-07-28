import { lineNumberAt } from '../project.js';
import type { ProjectDiscovery } from '../discover.js';
import { issueSeverity, type LintIssue, type LintOptions } from '../types.js';
import { resolveLintStrict } from '../types.js';

export function lintBootOrder(
  discovery: ProjectDiscovery,
  options: LintOptions = {},
): LintIssue[] {
  const strict = resolveLintStrict(options);
  const issues: LintIssue[] = [];
  const source = discovery.entrySource;
  if (!source) {
    return issues;
  }

  const file = discovery.entryRelative;
  const setRouteIndex = source.search(/\bsetRouteApplication\s*\(/);
  const bootIndex = source.search(/\bawait\s+app\.boot\s*\(/);
  const httpMwIndex = (() => {
    const a = source.search(/\bregisterHttpMiddleware\s*\(/);
    const b = source.search(/\bprepareHttpServer\s*\(/);
    if (a === -1) {
      return b;
    }
    if (b === -1) {
      return a;
    }
    return Math.min(a, b);
  })();

  const dynamicIndex = source.search(
    /(?:await\s+)?import\s*\(\s*['"][^'"]*routes[^'"]*['"]\s*\)/,
  );

  const usesThrottle = discovery.routes.some((route) =>
    route.middleware.some((alias) => alias.startsWith('throttle:')),
  );

  for (const imp of discovery.staticRouteImports) {
    issues.push({
      rule: 'route-before-facade',
      message:
        `Static import of "${imp.specifier}" runs before setRouteApplication; ` +
        'use a dynamic import of registerRoutes() after boot instead.',
      file,
      line: imp.line,
      severity: issueSeverity('route-before-facade', strict),
    });

    issues.push({
      rule: 'route-before-boot',
      message:
        `Static import of "${imp.specifier}" registers routes at module load time, ` +
        'before await app.boot() — auth/throttle middleware aliases may be missing.',
      file,
      line: imp.line,
      severity: issueSeverity('route-before-boot', strict),
    });
  }

  // Dynamic import before boot
  if (
    discovery.staticRouteImports.length === 0 &&
    dynamicIndex !== -1 &&
    bootIndex !== -1 &&
    dynamicIndex < bootIndex
  ) {
    issues.push({
      rule: 'route-before-boot',
      message: 'Routes are imported before await app.boot(); move registerRoutes() after boot.',
      file,
      line: lineNumberAt(source, dynamicIndex),
      severity: issueSeverity('route-before-boot', strict),
    });
  }

  // Dynamic import before setRouteApplication
  if (
    discovery.staticRouteImports.length === 0 &&
    dynamicIndex !== -1 &&
    setRouteIndex !== -1 &&
    dynamicIndex < setRouteIndex
  ) {
    issues.push({
      rule: 'route-before-facade',
      message: 'Routes are imported before setRouteApplication(app).',
      file,
      line: lineNumberAt(source, dynamicIndex),
      severity: issueSeverity('route-before-facade', strict),
    });
  }

  if (
    usesThrottle &&
    discovery.staticRouteImports.length === 0 &&
    dynamicIndex !== -1 &&
    httpMwIndex !== -1 &&
    dynamicIndex < httpMwIndex
  ) {
    issues.push({
      rule: 'route-before-http-middleware',
      message:
        'Routes using throttle:* are registered before registerHttpMiddleware/prepareHttpServer.',
      file,
      line: lineNumberAt(source, dynamicIndex),
      severity: issueSeverity('route-before-http-middleware', strict),
    });
  }

  if (
    usesThrottle &&
    discovery.staticRouteImports.length > 0 &&
    !discovery.hasRegisterHttpMiddleware &&
    !discovery.hasPrepareHttpServer
  ) {
    issues.push({
      rule: 'route-before-http-middleware',
      message:
        'Routes use throttle:* but entry never calls registerHttpMiddleware or prepareHttpServer.',
      file,
      line: discovery.staticRouteImports[0]?.line,
      severity: issueSeverity('route-before-http-middleware', strict),
    });
  }

  if (
    usesThrottle &&
    discovery.staticRouteImports.length > 0 &&
    (discovery.hasRegisterHttpMiddleware || discovery.hasPrepareHttpServer) &&
    httpMwIndex !== -1
  ) {
    // Static imports always run before prepareHttpServer body
    issues.push({
      rule: 'route-before-http-middleware',
      message:
        'Static route imports run before registerHttpMiddleware/prepareHttpServer; ' +
        'throttle:* aliases will not exist yet.',
      file,
      line: discovery.staticRouteImports[0]?.line,
      severity: issueSeverity('route-before-http-middleware', strict),
    });
  }

  return issues;
}
