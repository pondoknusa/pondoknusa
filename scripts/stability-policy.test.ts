import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');

describe('API stability policy', () => {
  it('documents semver tiers, deprecation, and experimental APIs', () => {
    const policy = readFileSync(join(ROOT, 'STABILITY.md'), 'utf8');
    const guide = readFileSync(join(ROOT, 'docs/guide/api-stability.md'), 'utf8');

    for (const doc of [policy, guide]) {
      expect(doc).toContain('Stable');
      expect(doc).toContain('Experimental');
      expect(doc).toContain('Deprecat');
      expect(doc).toMatch(/patch|Patch/i);
    }

    expect(policy).toContain('Deep imports');
    expect(guide).toContain('STABILITY.md');
    expect(policy).toContain('upgrading-to-1.0.md');
    expect(guide).toContain('/guide/upgrading-to-1.0');
    expect(readFileSync(join(ROOT, 'docs/guide/upgrading-to-1.0.md'), 'utf8')).toContain('Removed sync helpers');
  });
});