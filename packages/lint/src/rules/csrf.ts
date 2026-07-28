import type { ProjectDiscovery } from '../discover.js';
import {
  isNestedApiPath,
  pathMatchesCsrfExcept,
} from '../csrf-except.js';
import { issueSeverity, resolveLintStrict, type LintIssue, type LintOptions } from '../types.js';

const MUTATING = new Set(['post', 'put', 'patch', 'delete']);

export function lintCsrf(
  discovery: ProjectDiscovery,
  options: LintOptions = {},
): LintIssue[] {
  const strict = resolveLintStrict(options);
  const issues: LintIssue[] = [];
  const except = discovery.csrfExceptPatterns;
  const csrfActive = discovery.hasAuthServiceProvider;

  for (const route of discovery.routes) {
    if (!MUTATING.has(route.method) && route.method !== 'any' && route.method !== 'match') {
      continue;
    }

    const excepted = pathMatchesCsrfExcept(route.fullPath, except);

    // Route-level `csrf` alias: required for non-excepted web mutations.
    if (
      discovery.project.mode === 'web' &&
      MUTATING.has(route.method) &&
      !excepted &&
      !route.middleware.includes('csrf')
    ) {
      issues.push({
        rule: 'csrf-on-web-mutation',
        message:
          `Mutating web route ${route.method.toUpperCase()} ${route.fullPath} is missing "csrf" middleware. ` +
          'Without it, browsers/forms will get CSRF token mismatch (419) once AuthServiceProvider is active.',
        file: route.file,
        line: route.line,
        severity: issueSeverity('csrf-on-web-mutation', strict),
      });
    }

    if (!csrfActive) {
      continue;
    }

    // The classic footgun: `/api/*` does not match `/api/v1/...`
    if (!excepted && isNestedApiPath(route.fullPath) && MUTATING.has(route.method)) {
      issues.push({
        rule: 'csrf-except-gap',
        message:
          `Mutating route ${route.method.toUpperCase()} ${route.fullPath} is not covered by CSRF exceptions ` +
          `(${except.map((p) => `"${p}"`).join(', ')}). ` +
          'Default `/api/*` only matches one path segment — `/api/v1/...` still requires ' +
          'X-CSRF-TOKEN / _token, or widen except to `/api/**` or `/api/v1/*`.',
        file: route.file,
        line: route.line,
        severity: issueSeverity('csrf-except-gap', strict),
      });
      continue;
    }

    // Headless / token APIs: any non-excepted mutation will 419 without a CSRF token.
    if (
      !excepted &&
      MUTATING.has(route.method) &&
      (discovery.project.mode === 'headless' ||
        route.middleware.includes('auth:api') ||
        route.middleware.includes('guest'))
    ) {
      const isBrowserSessionFlow =
        discovery.project.mode === 'web' &&
        (route.middleware.includes('csrf') || route.middleware.includes('auth'));

      if (!isBrowserSessionFlow || discovery.project.mode === 'headless') {
        issues.push({
          rule: 'csrf-except-gap',
          message:
            `Mutating route ${route.method.toUpperCase()} ${route.fullPath} runs global CSRF verification ` +
            `(not matched by ${except.map((p) => `"${p}"`).join(', ')}). ` +
            'API/session clients will get 419 unless they send X-CSRF-TOKEN / _token, or you except this path.',
          file: route.file,
          line: route.line,
          severity: issueSeverity('csrf-except-gap', strict),
        });
      }
    }
  }

  issues.push(...lintForms(discovery, strict));
  return issues;
}

function lintForms(discovery: ProjectDiscovery, strict: boolean): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const view of discovery.viewFiles) {
    const source = discovery.viewSources.get(view);
    if (!source) {
      continue;
    }

    for (const form of findMutatingForms(source)) {
      if (form.hasCsrf) {
        continue;
      }

      issues.push({
        rule: 'csrf-form-missing-token',
        message:
          `Form with method ${form.method.toUpperCase()} is missing @csrf (or a hidden input name="_token"). ` +
          'Submitting it will produce CSRF token mismatch (419) in production.',
        file: view,
        line: form.line,
        severity: issueSeverity('csrf-form-missing-token', strict),
      });
    }
  }

  return issues;
}

interface MutatingForm {
  method: string;
  line: number;
  hasCsrf: boolean;
}

function findMutatingForms(source: string): MutatingForm[] {
  const forms: MutatingForm[] = [];
  const formRe = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let match: RegExpExecArray | null;

  while ((match = formRe.exec(source)) !== null) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    const methodMatch = attrs.match(/\bmethod\s*=\s*(['"])(post|put|patch|delete)\1/i);
    if (!methodMatch?.[2]) {
      continue;
    }

    const hasCsrf =
      /@csrf\b/.test(body) ||
      /\bname\s*=\s*(['"])_token\1/i.test(body) ||
      /\bcsrf_token\s*\(/.test(body);

    forms.push({
      method: methodMatch[2].toLowerCase(),
      line: lineNumberAt(source, match.index ?? 0),
      hasCsrf,
    });
  }

  return forms;
}

function lineNumberAt(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') {
      line += 1;
    }
  }
  return line;
}
