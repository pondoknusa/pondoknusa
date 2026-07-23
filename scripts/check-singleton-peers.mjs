/**
 * Guard against nested singleton-registry packages.
 *
 * DatabaseManager.extend / StorageManager.extend mutate module-static Maps.
 * Framework packages must declare @pondoknusa/database and @pondoknusa/storage
 * as peerDependencies (never hard dependencies) so apps hoist one physical copy.
 *
 * Modes:
 *   --policy   (default) Fail if any published package hard-depends on a host,
 *              or pins an exact peer version that forces nests on patch bumps.
 *   --fixture  Install a minimal app that uses database-d1 from packed workspace
 *              packages; fail if npm ls shows more than one physical host install.
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = join(ROOT, 'packages');

const HOST_PACKAGES = ['@pondoknusa/database', '@pondoknusa/storage'];
const HOST_OWNERS = new Set(['@pondoknusa/database', '@pondoknusa/storage']);

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function listPackageJsonPaths(packagesDir = PACKAGES_DIR) {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesDir, entry.name, 'package.json'))
    .filter((path) => existsSync(path));
}

/**
 * @returns {string[]} human-readable violation messages
 */
export function collectSingletonPeerViolations(packagesDir = PACKAGES_DIR) {
  const violations = [];

  for (const pkgPath of listPackageJsonPaths(packagesDir)) {
    const pkg = readJson(pkgPath);
    if (!pkg.name?.startsWith('@pondoknusa/')) continue;
    if (HOST_OWNERS.has(pkg.name)) continue;

    for (const host of HOST_PACKAGES) {
      if (pkg.dependencies?.[host]) {
        violations.push(
          `${pkg.name} lists ${host} in dependencies; move it to peerDependencies (^x.y.0)`,
        );
      }

      const peer = pkg.peerDependencies?.[host];
      if (peer != null && /^\d+\.\d+\.\d+$/.test(String(peer))) {
        violations.push(
          `${pkg.name} peerDependency ${host}@${peer} should use a range (e.g. ^${peer})`,
        );
      }
    }
  }

  return violations;
}

function checkPolicy() {
  const violations = collectSingletonPeerViolations();
  if (violations.length > 0) {
    process.stderr.write('Singleton peer policy failed:\n');
    for (const violation of violations) {
      process.stderr.write(`  - ${violation}\n`);
    }
    process.exit(1);
  }
  process.stdout.write(
    'Singleton peer policy OK (database/storage are ranged peers, not hard deps).\n',
  );
}

function listWorkspacePackages() {
  const byName = new Map();
  for (const pkgPath of listPackageJsonPaths()) {
    const pkg = readJson(pkgPath);
    if (!pkg.name?.startsWith('@pondoknusa/')) continue;
    byName.set(pkg.name, { dir: dirname(pkgPath), pkg });
  }
  return byName;
}

function collectTransitiveWorkspaceDeps(rootNames, byName) {
  const needed = new Set(rootNames);
  const queue = [...rootNames];
  while (queue.length > 0) {
    const name = queue.pop();
    const entry = byName.get(name);
    if (!entry) continue;
    for (const depType of ['dependencies', 'peerDependencies']) {
      for (const dep of Object.keys(entry.pkg[depType] ?? {})) {
        if (dep.startsWith('@pondoknusa/') && byName.has(dep) && !needed.has(dep)) {
          needed.add(dep);
          queue.push(dep);
        }
      }
    }
  }
  return needed;
}

function run(command, args, options = {}) {
  // On Windows, invoke npm via `node .../npm-cli.js` so we avoid shell:true.
  let bin = command;
  let binArgs = args;
  if (command === 'npm') {
    const npmCli = [
      join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      join(dirname(dirname(process.execPath)), 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      join(dirname(dirname(process.execPath)), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    ].find((candidate) => existsSync(candidate));
    if (npmCli) {
      bin = process.execPath;
      binArgs = [npmCli, ...args];
    } else if (process.platform === 'win32') {
      bin = 'npm.cmd';
    }
  }

  const result = spawnSync(bin, binArgs, {
    encoding: 'utf8',
    ...options,
  });
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n');
    throw new Error(`${command} ${args.join(' ')} failed:\n${detail}`);
  }
  return result;
}

function rewriteWorkspaceDepsToFile(pkg, folderNameByPackageName) {
  const next = structuredClone(pkg);
  for (const depType of ['dependencies', 'optionalDependencies']) {
    if (!next[depType]) continue;
    for (const name of Object.keys(next[depType])) {
      const folder = folderNameByPackageName.get(name);
      if (folder) {
        next[depType][name] = `file:../${folder}`;
      }
    }
  }
  // Keep peerDependencies as version ranges — the fixture app supplies hosts.
  return next;
}

function countParseableInstalls(npmLsParseableStdout, packageName) {
  const needle = `/node_modules/${packageName}`;
  const paths = npmLsParseableStdout
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, '/'))
    .filter((line) => line.endsWith(needle));
  return new Set(paths).size;
}

function ensurePackableDist(packageDir, stagingDir) {
  mkdirSync(stagingDir, { recursive: true });
  const distSrc = join(packageDir, 'dist');
  const distDest = join(stagingDir, 'dist');
  if (existsSync(distSrc)) {
    cpSync(distSrc, distDest, { recursive: true });
    return;
  }
  mkdirSync(distDest, { recursive: true });
  writeFileSync(join(distDest, 'index.js'), 'export {};\n');
  writeFileSync(join(distDest, 'index.d.ts'), 'export {};\n');
}

function checkFixture() {
  const byName = listWorkspacePackages();
  const roots = [
    '@pondoknusa/core',
    '@pondoknusa/database',
    '@pondoknusa/database-d1',
    '@pondoknusa/storage',
  ];
  for (const name of roots) {
    if (!byName.has(name)) {
      throw new Error(`Missing workspace package ${name}`);
    }
  }

  const needed = collectTransitiveWorkspaceDeps(roots, byName);
  const work = mkdtempSync(join(tmpdir(), 'pondoknusa-singleton-'));
  const vendorDir = join(work, 'packages');
  const appDir = join(work, 'app');
  mkdirSync(vendorDir);
  mkdirSync(appDir);

  try {
    const folderNameByPackageName = new Map();
    for (const name of needed) {
      folderNameByPackageName.set(name, name.replace('@pondoknusa/', ''));
    }

    for (const name of needed) {
      const { dir, pkg } = byName.get(name);
      const folder = folderNameByPackageName.get(name);
      const stagingDir = join(vendorDir, folder);
      ensurePackableDist(dir, stagingDir);
      const rewritten = rewriteWorkspaceDepsToFile(pkg, folderNameByPackageName);
      // Drop devDependencies so npm install does not pull test-only graph.
      delete rewritten.devDependencies;
      writeFileSync(join(stagingDir, 'package.json'), `${JSON.stringify(rewritten, null, 2)}\n`);
    }

    const appPkg = {
      name: 'singleton-peer-fixture',
      private: true,
      type: 'module',
      dependencies: {
        '@pondoknusa/core': 'file:../packages/core',
        '@pondoknusa/database': 'file:../packages/database',
        '@pondoknusa/database-d1': 'file:../packages/database-d1',
        '@pondoknusa/storage': 'file:../packages/storage',
      },
    };
    writeFileSync(join(appDir, 'package.json'), `${JSON.stringify(appPkg, null, 2)}\n`);

    run('npm', ['install', '--no-fund', '--no-audit'], {
      cwd: appDir,
      env: { ...process.env, npm_config_package_lock: 'false' },
    });

    for (const host of HOST_PACKAGES) {
      const ls = run('npm', ['ls', host, '--parseable', '--all'], { cwd: appDir });
      const count = countParseableInstalls(ls.stdout, host);
      if (count !== 1) {
        const tree = run('npm', ['ls', host, '--all'], { cwd: appDir });
        process.stderr.write(
          `Expected exactly one physical ${host} install, found ${count}.\n${tree.stdout}\n`,
        );
        process.exit(1);
      }
    }

    process.stdout.write(
      'Singleton fixture OK (one @pondoknusa/database and one @pondoknusa/storage install).\n',
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const fixture = process.argv.includes('--fixture');
  checkPolicy();
  if (fixture) {
    checkFixture();
  }
}
