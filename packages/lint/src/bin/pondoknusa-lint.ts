#!/usr/bin/env node

import { lintApplication, lintHasErrors, type LintIssue } from '../index.js';

function parseArgs(argv: string[]): {
  strict: boolean;
  staticOnly: boolean;
  path?: string;
  help: boolean;
} {
  let strict = false;
  let staticOnly = false;
  let path: string | undefined;
  let help = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      help = true;
      continue;
    }
    if (token === '--strict') {
      strict = true;
      continue;
    }
    if (token === '--static-only') {
      staticOnly = true;
      continue;
    }
    if (token === '--path' || token === '-p') {
      path = argv[i + 1];
      i += 1;
      continue;
    }
    if (token?.startsWith('--path=')) {
      path = token.slice('--path='.length);
    }
  }

  return { strict, staticOnly, path, help };
}

function printIssue(issue: LintIssue): void {
  const location =
    issue.file !== undefined
      ? issue.line !== undefined
        ? issue.column !== undefined
          ? `${issue.file}:${issue.line}:${issue.column}`
          : `${issue.file}:${issue.line}`
        : issue.file
      : '';
  const label = issue.severity === 'error' ? 'error' : 'warning';
  const where = location ? ` ${location}` : '';
  console.error(`[${label}] [${issue.rule}]${where} ${issue.message}`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: pondoknusa-lint [--strict] [--static-only] [--path <dir>]

Lint a Pondoknusa application for route, auth, and CSRF issues.

By default this also boots the app and sends mutating HTTP requests to verify
CSRF (419) behavior. That is slower and intended for pre-deploy / CI.

Options:
  --strict        Treat all findings as errors
  --static-only   Skip in-process CSRF request probes
  --path, -p      Project root (defaults to cwd / nearest project)
  --help, -h      Show this help
`);
  process.exit(0);
}

try {
  const start = args.path ?? process.cwd();
  const { issues, runtime } = await lintApplication(start, {
    strict: args.strict || undefined,
    runtime: args.staticOnly ? false : true,
  });

  if (issues.length === 0) {
    console.log(
      runtime
        ? 'No lint issues found (static + CSRF request probes).'
        : 'No lint issues found (static only).',
    );
    process.exit(0);
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  for (const issue of errors) {
    printIssue(issue);
  }
  for (const issue of warnings) {
    printIssue(issue);
  }

  const summary = [
    errors.length > 0 ? `${errors.length} error(s)` : null,
    warnings.length > 0 ? `${warnings.length} warning(s)` : null,
  ]
    .filter(Boolean)
    .join(', ');

  console.error(`Found ${summary}.`);
  process.exit(lintHasErrors(issues) ? 1 : 0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
