import type { ProjectDiscovery } from '../discover.js';
import { issueSeverity, resolveLintStrict, type LintIssue, type LintOptions } from '../types.js';

export function lintRoutes(
  discovery: ProjectDiscovery,
  options: LintOptions = {},
): LintIssue[] {
  const strict = resolveLintStrict(options);
  const issues: LintIssue[] = [];

  const routeBasenames = discovery.routeFiles.map((f) => f.replace(/^.*\//, ''));
  const hasIndex = discovery.routeFiles.some(
    (f) => f.endsWith('/routes/index.ts') || f.endsWith('/routes/index.js'),
  );
  const nonIndexRouteFiles = discovery.routeFiles.filter(
    (f) => !f.endsWith('/routes/index.ts') && !f.endsWith('/routes/index.js'),
  );

  if (!hasIndex && nonIndexRouteFiles.length > 1) {
    issues.push({
      rule: 'missing-register-routes',
      message:
        `Found ${nonIndexRouteFiles.length} route files without src/routes/index.ts exporting ` +
        'registerRoutes(); CLI tools (route:list, deploy:check) only load the first candidate.',
      file: nonIndexRouteFiles[0],
      severity: issueSeverity('missing-register-routes', strict),
    });
  }

  // Unreachable route files: not imported from index or entry
  const importedSpecifiers = new Set<string>();

  const indexFile = discovery.routeFiles.find(
    (f) => f.endsWith('/routes/index.ts') || f.endsWith('/routes/index.js'),
  );
  if (indexFile) {
    const source = discovery.routeSources.get(indexFile) ?? '';
    for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      importedSpecifiers.add(normalizeRouteSpecifier(indexFile, match[1] ?? ''));
    }
    for (const match of source.matchAll(/import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      importedSpecifiers.add(normalizeRouteSpecifier(indexFile, match[1] ?? ''));
    }
  }

  if (discovery.entrySource) {
    for (const match of discovery.entrySource.matchAll(
      /(?:from\s+|import\s*\(\s*|import\s+)['"](\.[^'"]*routes[^'"]*)['"]/g,
    )) {
      importedSpecifiers.add(
        normalizeRouteSpecifier(discovery.entryRelative, match[1] ?? ''),
      );
    }
  }

  for (const file of nonIndexRouteFiles) {
    if (hasIndex) {
      const normalized = file.replace(/\\/g, '/').replace(/\.js$/, '.ts');
      const reachable = [...importedSpecifiers].some((spec) => {
        const s = spec.replace(/\\/g, '/').replace(/\.js$/, '.ts');
        return s === normalized || s.endsWith('/' + normalized.split('/').pop());
      });
      if (!reachable) {
        issues.push({
          rule: 'unreachable-route-file',
          message: `Route file "${file}" is never imported from routes/index or the app entry.`,
          file,
          severity: issueSeverity('unreachable-route-file', strict),
        });
      }
    }
  }

  // Duplicate route names
  const names = new Map<string, { file: string; line: number }>();
  for (const route of discovery.routes) {
    if (!route.name) {
      continue;
    }
    const existing = names.get(route.name);
    if (existing) {
      issues.push({
        rule: 'duplicate-route-name',
        message: `Route name "${route.name}" is already used at ${existing.file}:${existing.line}.`,
        file: route.file,
        line: route.line,
        severity: issueSeverity('duplicate-route-name', strict),
      });
    } else {
      names.set(route.name, { file: route.file, line: route.line });
    }
  }

  // Duplicate method + path
  const signatures = new Map<string, { file: string; line: number }>();
  for (const route of discovery.routes) {
    const key = `${route.method.toUpperCase()} ${route.fullPath}`;
    const existing = signatures.get(key);
    if (existing) {
      issues.push({
        rule: 'duplicate-route-method-path',
        message: `Duplicate route ${key} (also at ${existing.file}:${existing.line}).`,
        file: route.file,
        line: route.line,
        severity: issueSeverity('duplicate-route-method-path', strict),
      });
    } else {
      signatures.set(key, { file: route.file, line: route.line });
    }
  }

  void routeBasenames;
  return issues;
}

function normalizeRouteSpecifier(fromFile: string, specifier: string): string {
  const fromDir = fromFile.replace(/\/[^/]+$/, '');
  let path = specifier.replace(/^\.\//, '');
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const parts = fromDir.split('/');
    for (const segment of specifier.split('/')) {
      if (segment === '.' || segment === '') {
        continue;
      }
      if (segment === '..') {
        parts.pop();
        continue;
      }
      parts.push(segment);
    }
    path = parts.join('/');
  }
  return path.replace(/\.js$/, '.ts');
}
