#!/usr/bin/env node
/**
 * Publish Pondoknusa packages to npm from a local machine.
 *
 * Replaces the GitHub Actions publish job: npm's long-lived automation
 * tokens are deprecated, so publishing now happens interactively under the
 * maintainer's own npm login (web auth + 2FA).
 *
 * Usage:
 *   npm run release:prepare <version>   # bump, build, test, tag, push
 *   npm run release:publish             # this script — login + publish
 *
 * Flags:
 *   --plan     Print the publish order and skip list; no auth, no publish.
 *   --dry-run  Login, then `npm publish --dry-run` each package.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = join(ROOT, 'packages');

const args = new Set(process.argv.slice(2));
const PLAN_ONLY = args.has('--plan');
const DRY_RUN = args.has('--dry-run');

import { createRequire } from 'node:module';

/**
 * Spawning `npm`/`npm.cmd` directly is blocked on Windows (EINVAL without a
 * shell), so run the npm CLI through the current Node binary. `npm_execpath`
 * is set when invoked via `npm run`; fall back to the globally installed npm.
 */
function npmInvocation() {
  const require = createRequire(import.meta.url);
  const candidates = [
    process.env.npm_execpath,
    (() => {
      try {
        return require.resolve('npm/bin/npm-cli.js');
      } catch {
        return undefined;
      }
    })(),
    // Standard layout: npm ships inside the Node installation.
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  const cli = candidates.find((candidate) => candidate && candidate.endsWith('.js') && existsSync(candidate));
  if (cli) {
    return { command: process.execPath, prefix: [cli] };
  }
  return { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', prefix: [] };
}

const NPM = npmInvocation();

function spawnNpm(argv, options = {}) {
  const result = spawnSync(NPM.command, [...NPM.prefix, ...argv], {
    cwd: ROOT,
    encoding: 'utf8',
    ...options,
  });
  if (result.error) {
    throw result.error;
  }
  return result;
}

function runNpm(argv, options = {}) {
  const result = spawnNpm(argv, options);
  if (options.inherit) {
    return result.status === 0;
  }
  if (result.status !== 0) {
    throw new Error(`npm ${argv.join(' ')} failed:\n${result.stderr ?? result.stdout}`);
  }
  return (result.stdout ?? '').trim();
}

// ── Workspace discovery + dependency-ordered publish plan ───────────────

export function listWorkspacePackages(packagesDir = PACKAGES_DIR) {
  const packages = new Map();
  for (const dir of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) {
      continue;
    }
    const manifestPath = join(packagesDir, dir.name, 'package.json');
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      continue;
    }
    if (manifest.private) {
      continue;
    }
    packages.set(manifest.name, {
      name: manifest.name,
      version: manifest.version,
      workspaceDeps: [
        ...Object.keys(manifest.dependencies ?? {}),
        ...Object.keys(manifest.peerDependencies ?? {}),
      ].filter((dep) => dep.startsWith('@pondoknusa/')),
    });
  }
  return packages;
}

/** Kahn's algorithm; alphabetical tiebreak keeps the order deterministic. */
export function publishOrder(packages) {
  const indegree = new Map();
  const dependents = new Map();
  for (const name of packages.keys()) {
    indegree.set(name, 0);
    dependents.set(name, []);
  }
  for (const pkg of packages.values()) {
    for (const dep of pkg.workspaceDeps) {
      if (!packages.has(dep)) {
        continue;
      }
      indegree.set(pkg.name, indegree.get(pkg.name) + 1);
      dependents.get(dep).push(pkg.name);
    }
  }

  const ready = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([name]) => name).sort();
  const order = [];
  while (ready.length > 0) {
    const name = ready.shift();
    order.push(name);
    for (const dependent of dependents.get(name).sort()) {
      indegree.set(dependent, indegree.get(dependent) - 1);
      if (indegree.get(dependent) === 0) {
        ready.push(dependent);
        ready.sort();
      }
    }
  }
  if (order.length !== packages.size) {
    throw new Error('Dependency cycle detected among workspace packages');
  }
  return order;
}

function remoteVersion(name) {
  const result = spawnNpm(['view', name, 'version']);
  return result.status === 0 ? (result.stdout ?? '').trim() : '';
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const packages = listWorkspacePackages();
  const order = publishOrder(packages);

  if (PLAN_ONLY) {
    for (const name of order) {
      const pkg = packages.get(name);
      const remote = remoteVersion(name);
      const status = remote === pkg.version ? 'skip (already published)' : 'PUBLISH';
      console.log(`${status.padEnd(28)} ${name}@${pkg.version}`);
    }
    return;
  }

  // Interactive npm login. Web auth opens a browser; 2FA prompts on TTY.
  let whoami;
  try {
    whoami = runNpm(['whoami']);
  } catch {
    whoami = '';
  }
  if (!whoami) {
    console.log('Not logged into npm — starting login (browser/OTP prompt)…');
    const ok = runNpm(['login'], { inherit: true, stdio: 'inherit' });
    if (!ok) {
      console.error('npm login failed');
      process.exit(1);
    }
    whoami = runNpm(['whoami']);
  }
  console.log(`Publishing as ${whoami}\n`);

  let published = 0;
  let skipped = 0;
  for (const name of order) {
    const pkg = packages.get(name);
    if (remoteVersion(name) === pkg.version) {
      console.log(`⏭  ${name}@${pkg.version} already published — skipping`);
      skipped += 1;
      continue;
    }

    console.log(`📦 Publishing ${name}@${pkg.version}…`);
    const argv = ['publish', `--workspace=${name}`, '--access', 'public'];
    if (DRY_RUN) {
      argv.push('--dry-run');
    }
    const ok = runNpm(argv, { inherit: true, stdio: 'inherit' });
    if (!ok) {
      console.error(`\n❌ ${name} failed — fix the error and re-run; published versions are skipped.`);
      process.exit(1);
    }
    published += 1;
  }

  console.log(`\n${DRY_RUN ? 'Dry run complete' : 'Publish complete'}: ${published} published, ${skipped} skipped`);
}

const isMain = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main();
}
