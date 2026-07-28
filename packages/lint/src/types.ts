export type LintRule =
  | 'route-before-facade'
  | 'route-before-boot'
  | 'route-before-http-middleware'
  | 'missing-register-routes'
  | 'unreachable-route-file'
  | 'unknown-middleware'
  | 'missing-throttle-preset'
  | 'csrf-on-web-mutation'
  | 'csrf-except-gap'
  | 'csrf-form-missing-token'
  | 'csrf-runtime-missing'
  | 'csrf-runtime-false-positive'
  | 'csrf-runtime-token-rejected'
  | 'csrf-runtime-boot-failed'
  | 'auth-guard-mismatch'
  | 'auth-provider-missing'
  | 'oauth-redirect-mismatch'
  | 'duplicate-route-name'
  | 'duplicate-route-method-path'
  | 'controller-action-missing'
  | 'anonymous-csrf';

export type LintSeverity = 'error' | 'warning';

export interface LintIssue {
  rule: LintRule;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  severity: LintSeverity;
}

export interface LintOptions {
  /** When true, every rule fails the lint run. Defaults to CI / PONDOKNUSA_APP_LINT_STRICT. */
  strict?: boolean;
  /**
   * Run in-process CSRF HTTP probes (default true).
   * Slow — meant for pre-deploy / CI. Pass false or CLI `--static-only` to skip.
   */
  runtime?: boolean;
}

/** Rules that are always errors even when not in strict mode. */
export const STRICT_ONLY_RULES = new Set<LintRule>([
  'route-before-facade',
  'route-before-boot',
  'unknown-middleware',
  'missing-throttle-preset',
  'auth-provider-missing',
  'duplicate-route-name',
  'controller-action-missing',
  'csrf-on-web-mutation',
  'csrf-except-gap',
  'csrf-form-missing-token',
  'csrf-runtime-missing',
  'csrf-runtime-false-positive',
  'csrf-runtime-token-rejected',
  'csrf-runtime-boot-failed',
  'anonymous-csrf',
]);

export function resolveLintStrict(options: LintOptions = {}): boolean {
  if (options.strict !== undefined) {
    return options.strict;
  }

  return process.env.PONDOKNUSA_APP_LINT_STRICT === '1' || process.env.CI === 'true';
}

export function resolveLintRuntime(options: LintOptions = {}): boolean {
  if (options.runtime !== undefined) {
    return options.runtime;
  }

  return process.env.PONDOKNUSA_APP_LINT_STATIC_ONLY !== '1';
}

export function lintHasErrors(issues: LintIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}

export function issueSeverity(rule: LintRule, strict: boolean): LintSeverity {
  if (strict || STRICT_ONLY_RULES.has(rule)) {
    return 'error';
  }

  return 'warning';
}
