import { describe, expect, it } from 'vitest';
import { buildCapabilityManifest } from './manifest.js';

describe('buildCapabilityManifest', () => {
  it('includes core packages, facades, and CLI commands', () => {
    const manifest = buildCapabilityManifest();
    expect(manifest.packages).toContain('@tyravel/vector');
    expect(manifest.packages).toContain('@tyravel/graphql');
    expect(manifest.packages).toContain('@tyravel/mcp');
    expect(manifest.facades).toContain('Route');
    expect(manifest.commands).toContain('tyravel vector:embed');
    expect(manifest.commands).toContain('tyravel mcp:serve');
  });
});