/**
 * CSRF except-path matching — same semantics as
 * packages/auth/src/verify-csrf-token.ts (`*` = one segment, `**` = any depth).
 */

/** Default exceptions registered by AuthServiceProvider. */
export const DEFAULT_CSRF_EXCEPT = [
  '/api/**',
  '/broadcasting/auth',
  '/webhooks/**',
] as const;

export function compileCsrfPathPattern(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Replace `**` first with a placeholder so the single-`*` pass cannot rewrite it.
  const regexSource = escaped
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  return new RegExp(`^${regexSource}$`);
}

export function pathMatchesCsrfExcept(
  path: string,
  patterns: readonly string[],
): boolean {
  const normalized = normalizeCsrfPath(path);
  return patterns.some((pattern) => compileCsrfPathPattern(pattern).test(normalized));
}

export function normalizeCsrfPath(path: string): string {
  const trimmed = path.replace(/\/+/g, '/');
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }
  return trimmed || '/';
}

/**
 * True when a path looks like a multi-segment API route that developers often
 * assume is covered by a single-segment `/api/*` except but is not
 * (e.g. `/api/v1/login`). Framework defaults use `/api/**`, which does cover these.
 */
export function isNestedApiPath(path: string): boolean {
  const normalized = normalizeCsrfPath(path);
  return /^\/api\/[^/]+\/.+/.test(normalized);
}

export function extractCsrfExceptPatterns(source: string): string[] | undefined {
  const match = source.match(
    /create(?:Verify)?Csrf(?:Token)?Middleware\s*\(\s*\{[\s\S]*?except\s*:\s*\[([^\]]*)\]/,
  );
  if (!match?.[1]) {
    return undefined;
  }

  const patterns: string[] = [];
  for (const lit of match[1].matchAll(/(['"])([^'"]+)\1/g)) {
    if (lit[2]) {
      patterns.push(lit[2]);
    }
  }
  return patterns.length > 0 ? patterns : undefined;
}
