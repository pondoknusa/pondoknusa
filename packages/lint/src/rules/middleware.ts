import type { ProjectDiscovery } from '../discover.js';
import { issueSeverity, resolveLintStrict, type LintIssue, type LintOptions } from '../types.js';

export function lintMiddleware(
  discovery: ProjectDiscovery,
  options: LintOptions = {},
): LintIssue[] {
  const strict = resolveLintStrict(options);
  const issues: LintIssue[] = [];

  for (const route of discovery.routes) {
    for (const alias of route.middleware) {
      if (alias.startsWith('throttle:')) {
        const preset = alias.slice('throttle:'.length);
        if (!discovery.throttlePresets.has(preset)) {
          issues.push({
            rule: 'missing-throttle-preset',
            message:
              `Middleware "${alias}" requires config.http.throttle.limits.${preset} ` +
              '(and registerHttpMiddleware/prepareHttpServer).',
            file: route.file,
            line: route.line,
            severity: issueSeverity('missing-throttle-preset', strict),
          });
        }
        continue;
      }

      if (!discovery.registeredMiddleware.has(alias)) {
        issues.push({
          rule: 'unknown-middleware',
          message:
            `Middleware alias "${alias}" is not registered via app.middleware() ` +
            'and is not a known framework alias.',
          file: route.file,
          line: route.line,
          severity: issueSeverity('unknown-middleware', strict),
        });
      }
    }
  }

  for (const usage of discovery.anonymousCsrfUsages) {
    issues.push({
      rule: 'anonymous-csrf',
      message:
        'Prefer the "csrf" middleware alias over an inline CSRF factory so the JSON fast path can tag routes correctly.',
      file: usage.file,
      line: usage.line,
      severity: issueSeverity('anonymous-csrf', strict),
    });
  }

  return issues;
}
