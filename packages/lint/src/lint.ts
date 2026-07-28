import { discoverProject } from './discover.js';
import { requireProjectRoot, resolveProject } from './project.js';
import { lintAuth } from './rules/auth.js';
import { lintBootOrder } from './rules/boot-order.js';
import { lintControllers } from './rules/controllers.js';
import { lintCsrf } from './rules/csrf.js';
import { lintMiddleware } from './rules/middleware.js';
import { lintRoutes } from './rules/routes.js';
import { lintCsrfRuntime } from './runtime-csrf.js';
import {
  lintHasErrors,
  resolveLintRuntime,
  resolveLintStrict,
  type LintIssue,
  type LintOptions,
} from './types.js';

export interface LintApplicationResult {
  root: string;
  issues: LintIssue[];
  strict: boolean;
  runtime: boolean;
}

export async function lintApplication(
  rootOrOptions?: string | LintOptions,
  maybeOptions: LintOptions = {},
): Promise<LintApplicationResult> {
  let root: string;
  let options: LintOptions;

  if (typeof rootOrOptions === 'string') {
    root = rootOrOptions;
    options = maybeOptions;
  } else {
    root = await requireProjectRoot();
    options = rootOrOptions ?? {};
  }

  const strict = resolveLintStrict(options);
  const runtime = resolveLintRuntime(options);
  const project = await resolveProject(root);
  const discovery = await discoverProject(project);

  const issues: LintIssue[] = [
    ...lintBootOrder(discovery, { strict }),
    ...lintRoutes(discovery, { strict }),
    ...lintMiddleware(discovery, { strict }),
    ...lintCsrf(discovery, { strict }),
    ...lintAuth(discovery, { strict }),
    ...lintControllers(discovery, { strict }),
  ];

  if (runtime) {
    issues.push(...(await lintCsrfRuntime(discovery, { strict, runtime })));
  }

  issues.sort((a, b) => {
    const fileA = a.file ?? '';
    const fileB = b.file ?? '';
    if (fileA !== fileB) {
      return fileA.localeCompare(fileB);
    }
    return (a.line ?? 0) - (b.line ?? 0);
  });

  return { root, issues, strict, runtime };
}

export { lintHasErrors, resolveLintStrict, resolveLintRuntime };
