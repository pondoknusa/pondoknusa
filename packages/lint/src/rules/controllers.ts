import { resolveControllerFile, type ProjectDiscovery } from '../discover.js';
import { issueSeverity, resolveLintStrict, type LintIssue, type LintOptions } from '../types.js';

export function lintControllers(
  discovery: ProjectDiscovery,
  options: LintOptions = {},
): LintIssue[] {
  const strict = resolveLintStrict(options);
  const issues: LintIssue[] = [];

  for (const route of discovery.routes) {
    if (!route.controller) {
      continue;
    }

    const { ident, action } = route.controller;
    const controllerFile = resolveControllerFile(discovery, route.file, ident);

    if (!controllerFile) {
      // Can't resolve — skip rather than false positive
      continue;
    }

    const methods = discovery.controllerMethods.get(controllerFile);
    if (!methods) {
      // Controller file not under src/controllers — skip
      continue;
    }

    if (!methods.has(action)) {
      issues.push({
        rule: 'controller-action-missing',
        message: `Controller action "${ident}.${action}" was not found in ${controllerFile}.`,
        file: route.file,
        line: route.line,
        severity: issueSeverity('controller-action-missing', strict),
      });
    }
  }

  return issues;
}
