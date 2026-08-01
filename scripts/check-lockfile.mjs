/**
 * Guard against package-lock.json drifting from workspace package.json files.
 *
 * The common failure mode in this monorepo is npm rewriting the lock so a
 * workspace package (historically packages/database) disappears and is replaced
 * by nested registry tarball entries. CI uses `npm ci`, which then fails with:
 *   Missing: @pondoknusa/database@x.y.z from lock file
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE_ROOTS = ['packages', 'examples'];

/**
 * @param {string} root
 * @returns {{ path: string, dir: string, pkg: Record<string, unknown> }[]}
 */
export function listWorkspacePackages(root = ROOT) {
  /** @type {{ path: string, dir: string, pkg: Record<string, unknown> }[]} */
  const out = [];
  for (const workspaceRoot of WORKSPACE_ROOTS) {
    const absRoot = join(root, workspaceRoot);
    if (!existsSync(absRoot)) continue;
    for (const dirent of readdirSync(absRoot, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      const pkgPath = join(absRoot, dirent.name, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      out.push({
        path: pkgPath,
        dir: `${workspaceRoot}/${dirent.name}`,
        pkg,
      });
    }
  }
  return out;
}

/**
 * @param {string} root
 * @returns {string[]} human-readable violation messages
 */
export function collectLockfileViolations(root = ROOT) {
  const lockPath = join(root, 'package-lock.json');
  if (!existsSync(lockPath)) {
    return ['package-lock.json is missing'];
  }

  /** @type {{ packages?: Record<string, Record<string, unknown>> }} */
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  const packages = lock.packages ?? {};
  /** @type {string[]} */
  const violations = [];

  for (const { dir, pkg } of listWorkspacePackages(root)) {
    const entry = packages[dir];
    if (!entry) {
      violations.push(
        `missing lock entry for workspace package ${dir}`
          + (typeof pkg.name === 'string' ? ` (${pkg.name})` : '')
          + ' — run `npm install` and commit package-lock.json',
      );
      continue;
    }

    if (typeof pkg.version === 'string' && entry.version !== pkg.version) {
      violations.push(
        `${dir}: package.json version ${pkg.version} != lockfile version ${String(entry.version)}`,
      );
    }

    if (typeof pkg.name === 'string' && entry.name != null && entry.name !== pkg.name) {
      violations.push(
        `${dir}: package.json name ${pkg.name} != lockfile name ${String(entry.name)}`,
      );
    }
  }

  for (const [key, entry] of Object.entries(packages)) {
    const isWorkspaceInstall =
      key.includes('/node_modules/@pondoknusa/')
      || key.endsWith('/node_modules/@pondoknusa')
      || key.includes('/node_modules/create-pondoknusa')
      || key === 'node_modules/@pondoknusa'
      || key.startsWith('node_modules/@pondoknusa/')
      || key === 'node_modules/create-pondoknusa';

    if (!isWorkspaceInstall) continue;
    if (entry.link === true) continue;

    violations.push(
      `${key} is a non-linked install of a workspace package`
        + (entry.resolved != null ? ` (resolved ${String(entry.resolved)})` : '')
        + ' — lockfile should link workspaces; run `npm install` from the repo root',
    );
  }

  return violations;
}

function main() {
  const violations = collectLockfileViolations();
  if (violations.length === 0) {
    console.log('Lockfile OK (workspace packages present and linked).');
    return;
  }

  console.error('Lockfile is out of sync with workspace package.json files:\n');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error('\nFix: npm install && git add package-lock.json');
  process.exit(1);
}

const isMain = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main();
}
