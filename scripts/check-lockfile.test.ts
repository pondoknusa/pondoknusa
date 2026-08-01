import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectLockfileViolations } from './check-lockfile.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

describe('check-lockfile', () => {
  it('accepts the real repository lockfile', () => {
    expect(collectLockfileViolations()).toEqual([]);
  });

  it('flags missing workspace entries and nested registry installs', () => {
    const root = mkdtempSync(join(tmpdir(), 'lockfile-check-'));
    tempDirs.push(root);

    mkdirSync(join(root, 'packages', 'database'), { recursive: true });
    mkdirSync(join(root, 'packages', 'core'), { recursive: true });
    writeJson(join(root, 'packages', 'database', 'package.json'), {
      name: '@pondoknusa/database',
      version: '4.0.1',
    });
    writeJson(join(root, 'packages', 'core', 'package.json'), {
      name: '@pondoknusa/core',
      version: '4.0.1',
      devDependencies: { '@pondoknusa/database': '4.0.1' },
    });

    writeJson(join(root, 'package-lock.json'), {
      name: 'pondoknusa',
      lockfileVersion: 3,
      packages: {
        '': { name: 'pondoknusa', workspaces: ['packages/*'] },
        // packages/database intentionally missing — reproduces the CI failure
        'packages/core': {
          name: '@pondoknusa/core',
          version: '4.0.1',
          devDependencies: { '@pondoknusa/database': '4.0.1' },
        },
        'packages/core/node_modules/@pondoknusa/database': {
          version: '4.0.1',
          resolved: 'https://registry.npmjs.org/@pondoknusa/database/-/database-4.0.1.tgz',
          integrity: 'sha512-test',
        },
        'node_modules/@pondoknusa/core': {
          resolved: 'packages/core',
          link: true,
        },
      },
    });

    expect(collectLockfileViolations(root)).toEqual([
      'missing lock entry for workspace package packages/database (@pondoknusa/database) — run `npm install` and commit package-lock.json',
      'packages/core/node_modules/@pondoknusa/database is a non-linked install of a workspace package (resolved https://registry.npmjs.org/@pondoknusa/database/-/database-4.0.1.tgz) — lockfile should link workspaces; run `npm install` from the repo root',
    ]);
  });

  it('flags workspace version drift', () => {
    const root = mkdtempSync(join(tmpdir(), 'lockfile-ver-'));
    tempDirs.push(root);

    mkdirSync(join(root, 'packages', 'support'), { recursive: true });
    writeJson(join(root, 'packages', 'support', 'package.json'), {
      name: '@pondoknusa/support',
      version: '4.0.1',
    });
    writeJson(join(root, 'package-lock.json'), {
      lockfileVersion: 3,
      packages: {
        'packages/support': {
          name: '@pondoknusa/support',
          version: '4.0.0',
        },
        'node_modules/@pondoknusa/support': {
          resolved: 'packages/support',
          link: true,
        },
      },
    });

    expect(collectLockfileViolations(root)).toEqual([
      'packages/support: package.json version 4.0.1 != lockfile version 4.0.0',
    ]);
  });
});
