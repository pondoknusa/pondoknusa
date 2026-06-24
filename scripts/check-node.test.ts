import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const CHECK_NODE = fileURLToPath(new URL('./check-node.mjs', import.meta.url));

describe('check-node', () => {
  it('accepts the current Node runtime', () => {
    const major = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
    const result = spawnSync(process.execPath, [CHECK_NODE], { encoding: 'utf8' });
    if (major >= 26) {
      expect(result.status).toBe(0);
      return;
    }
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Node 26+ is required');
  });
});