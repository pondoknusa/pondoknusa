import { isNestedApiPath, pathMatchesCsrfExcept } from './csrf-except.js';
import type { DiscoveredRoute } from './discover.js';
import { issueSeverity, resolveLintStrict, type LintIssue, type LintOptions } from './types.js';

export type CsrfProbeExpectation = 'require-419' | 'forbid-419';

export interface CsrfRuntimeProbe {
  method: string;
  path: string;
  expectation: CsrfProbeExpectation;
  reason: string;
  /** When true, send a matching session + X-CSRF-TOKEN (sanity check). */
  withToken?: boolean;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function substitutePathParams(pattern: string): string {
  return pattern.replace(/:([A-Za-z_][\w]*)/g, (_match, name: string) => {
    if (/id$/i.test(name) || name === 'id') {
      return '1';
    }
    return 'test';
  });
}

export function buildCsrfRuntimeProbes(
  routes: Array<Pick<DiscoveredRoute, 'method' | 'fullPath'> | { method: string; uri: string }>,
  exceptPatterns: readonly string[],
): CsrfRuntimeProbe[] {
  const probes: CsrfRuntimeProbe[] = [];
  const seen = new Set<string>();

  for (const route of routes) {
    const method = route.method.toUpperCase();
    const pattern = 'fullPath' in route ? route.fullPath : route.uri;
    if (!MUTATING.has(method) && method !== 'ANY' && method !== 'MATCH') {
      continue;
    }

    const concreteMethod = method === 'ANY' || method === 'MATCH' ? 'POST' : method;
    const path = substitutePathParams(pattern);
    const key = `${concreteMethod} ${path}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const excepted = pathMatchesCsrfExcept(path, exceptPatterns);

    if (excepted) {
      probes.push({
        method: concreteMethod,
        path,
        expectation: 'forbid-419',
        reason: `Path matches CSRF except (${exceptPatterns.join(', ')}) — clients must not get 419 for a missing token.`,
      });
      continue;
    }

    probes.push({
      method: concreteMethod,
      path,
      expectation: 'require-419',
      reason: isNestedApiPath(path)
        ? 'Nested API path is not CSRF-excepted; missing token must yield 419 (or widen except).'
        : 'Mutating route is CSRF-protected; missing token must yield 419.',
    });
  }

  const protectedProbe = probes.find((probe) => probe.expectation === 'require-419');
  if (protectedProbe) {
    probes.push({
      ...protectedProbe,
      withToken: true,
      expectation: 'forbid-419',
      reason:
        'Protected route must accept a matching X-CSRF-TOKEN (ensures 419 is real CSRF, not a broken app).',
    });
  }

  return probes;
}

export interface RuntimeRequestResult {
  status: number;
}

export type RuntimeRequestHandler = (
  method: string,
  path: string,
  options?: { csrfToken?: string },
) => Promise<RuntimeRequestResult>;

export async function runCsrfRuntimeProbes(
  handle: RuntimeRequestHandler,
  probes: CsrfRuntimeProbe[],
  options: LintOptions = {},
): Promise<LintIssue[]> {
  const strict = resolveLintStrict(options);
  const issues: LintIssue[] = [];

  for (const probe of probes) {
    const result = await handle(probe.method, probe.path, {
      csrfToken: probe.withToken ? 'lint-runtime-csrf-token' : undefined,
    });

    if (probe.expectation === 'require-419' && result.status !== 419) {
      issues.push({
        rule: 'csrf-runtime-missing',
        message:
          `${probe.method} ${probe.path} returned ${result.status} without a CSRF token; expected 419. ` +
          `${probe.reason} CSRF middleware is likely missing from the live stack (boot order / static route imports).`,
        severity: issueSeverity('csrf-runtime-missing', strict),
      });
      continue;
    }

    if (probe.expectation === 'forbid-419' && result.status === 419) {
      issues.push({
        rule: probe.withToken ? 'csrf-runtime-token-rejected' : 'csrf-runtime-false-positive',
        message: probe.withToken
          ? `${probe.method} ${probe.path} returned 419 even with a matching CSRF token. ${probe.reason}`
          : `${probe.method} ${probe.path} returned 419 but should be CSRF-excepted. ${probe.reason}`,
        severity: issueSeverity(
          probe.withToken ? 'csrf-runtime-token-rejected' : 'csrf-runtime-false-positive',
          strict,
        ),
      });
    }
  }

  return issues;
}
