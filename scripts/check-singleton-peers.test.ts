import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectSingletonPeerViolations } from './check-singleton-peers.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function writePkg(root: string, folder: string, pkg: Record<string, unknown>) {
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
}

describe('check-singleton-peers policy', () => {
  it('accepts the real packages workspace', () => {
    expect(collectSingletonPeerViolations()).toEqual([]);
  });

  it('flags hard dependencies and exact peer pins on singleton hosts', () => {
    const root = mkdtempSync(join(tmpdir(), 'singleton-policy-'));
    tempDirs.push(root);

    writePkg(root, 'core', {
      name: '@pondoknusa/core',
      dependencies: { '@pondoknusa/database': '3.2.0' },
    });
    writePkg(root, 'database-d1', {
      name: '@pondoknusa/database-d1',
      peerDependencies: { '@pondoknusa/database': '3.2.0' },
    });
    writePkg(root, 'database', {
      name: '@pondoknusa/database',
      version: '3.2.0',
    });

    expect(collectSingletonPeerViolations(root)).toEqual([
      '@pondoknusa/core lists @pondoknusa/database in dependencies; move it to peerDependencies (^x.y.0)',
      '@pondoknusa/database-d1 peerDependency @pondoknusa/database@3.2.0 should use a range (e.g. ^3.2.0)',
    ]);
  });
});
