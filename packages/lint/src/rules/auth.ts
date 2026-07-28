import type { ProjectDiscovery } from '../discover.js';
import { issueSeverity, resolveLintStrict, type LintIssue, type LintOptions } from '../types.js';

export function lintAuth(
  discovery: ProjectDiscovery,
  options: LintOptions = {},
): LintIssue[] {
  const strict = resolveLintStrict(options);
  const issues: LintIssue[] = [];

  const usesAuthMiddleware = discovery.routes.some((route) =>
    route.middleware.some(
      (alias) =>
        alias === 'auth' ||
        alias === 'auth:api' ||
        alias === 'guest' ||
        alias === 'csrf' ||
        alias.startsWith('auth:'),
    ),
  );

  if (
    usesAuthMiddleware &&
    (!discovery.hasAuthServiceProvider || !discovery.hasSetAuthApplication)
  ) {
    issues.push({
      rule: 'auth-provider-missing',
      message:
        'Routes use auth/guest/csrf middleware but the entry does not register AuthServiceProvider ' +
        'and call setAuthApplication(app).',
      file: discovery.entryRelative,
      severity: issueSeverity('auth-provider-missing', strict),
    });
  }

  for (const route of discovery.routes) {
    const isApiPath =
      route.fullPath === '/api' ||
      route.fullPath.startsWith('/api/') ||
      route.fullPath.includes('/api/');

    if (route.middleware.includes('auth') && isApiPath) {
      issues.push({
        rule: 'auth-guard-mismatch',
        message:
          `Session middleware "auth" on API route ${route.fullPath}; prefer "auth:api" for Bearer tokens.`,
        file: route.file,
        line: route.line,
        severity: issueSeverity('auth-guard-mismatch', strict),
      });
    }

    if (
      discovery.project.mode === 'web' &&
      route.middleware.includes('auth:api') &&
      !isApiPath
    ) {
      issues.push({
        rule: 'auth-guard-mismatch',
        message:
          `Token middleware "auth:api" on non-API route ${route.fullPath}; prefer "auth" for session cookies.`,
        file: route.file,
        line: route.line,
        severity: issueSeverity('auth-guard-mismatch', strict),
      });
    }
  }

  const registeredPaths = new Set(
    discovery.routes.map((route) => normalizePath(route.fullPath)),
  );

  for (const redirect of discovery.oauthRedirectUris) {
    const path = pathFromUri(redirect.uri);
    if (!path) {
      continue;
    }

    if (![...registeredPaths].some((registered) => pathsMatch(registered, path))) {
      issues.push({
        rule: 'oauth-redirect-mismatch',
        message:
          `OAuth redirectUri path "${path}" for "${redirect.provider}" does not match any registered route.`,
        file: redirect.file,
        line: redirect.line,
        severity: issueSeverity('oauth-redirect-mismatch', strict),
      });
    }
  }

  return issues;
}

function pathFromUri(uri: string): string | undefined {
  if (uri.startsWith('/')) {
    return normalizePath(uri);
  }

  try {
    const url = new URL(uri);
    return normalizePath(url.pathname);
  } catch {
    if (uri.includes('://')) {
      return undefined;
    }
    return normalizePath(`/${uri}`);
  }
}

function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+/g, '/');
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }
  return trimmed || '/';
}

function pathsMatch(registered: string, redirect: string): boolean {
  if (registered === redirect) {
    return true;
  }
  const regParts = registered.split('/');
  const redParts = redirect.split('/');
  if (regParts.length !== redParts.length) {
    return false;
  }
  return regParts.every((part, index) => {
    if (part.startsWith(':')) {
      return true;
    }
    return part === redParts[index];
  });
}
