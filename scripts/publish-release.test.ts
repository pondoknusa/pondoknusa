import { describe, expect, it } from 'vitest';
import { listWorkspacePackages, publishOrder } from './publish-release.mjs';

function pkg(name, workspaceDeps = []) {
  return [name, { name, version: '1.0.0', workspaceDeps }];
}

describe('publishOrder', () => {
  it('orders dependencies before their dependents', () => {
    const packages = new Map([
      pkg('@pondoknusa/inference-openai', ['@pondoknusa/inference']),
      pkg('@pondoknusa/cli', ['@pondoknusa/core']),
      pkg('@pondoknusa/inference'),
      pkg('@pondoknusa/core', ['@pondoknusa/inference']),
    ]);

    const order = publishOrder(packages);
    expect(order.indexOf('@pondoknusa/inference')).toBeLessThan(order.indexOf('@pondoknusa/inference-openai'));
    expect(order.indexOf('@pondoknusa/inference')).toBeLessThan(order.indexOf('@pondoknusa/core'));
    expect(order.indexOf('@pondoknusa/core')).toBeLessThan(order.indexOf('@pondoknusa/cli'));
  });

  it('ignores dependencies outside the workspace set', () => {
    const packages = new Map([
      pkg('@pondoknusa/a', ['@pondoknusa/not-in-workspace']),
      pkg('@pondoknusa/b'),
    ]);
    expect(publishOrder(packages)).toEqual(['@pondoknusa/a', '@pondoknusa/b']);
  });

  it('throws on dependency cycles', () => {
    const packages = new Map([
      pkg('@pondoknusa/a', ['@pondoknusa/b']),
      pkg('@pondoknusa/b', ['@pondoknusa/a']),
    ]);
    expect(() => publishOrder(packages)).toThrow('Dependency cycle');
  });
});

describe('listWorkspacePackages', () => {
  it('discovers the real workspace including private-package filtering', () => {
    const packages = listWorkspacePackages();
    expect(packages.has('@pondoknusa/inference')).toBe(true);
    expect(packages.has('@pondoknusa/inference-openai')).toBe(true);
    expect(packages.has('create-pondoknusa')).toBe(true);
    expect(packages.get('@pondoknusa/inference-openai')?.workspaceDeps)
      .toContain('@pondoknusa/inference');
  });

  it('produces a valid topological order for the real workspace', () => {
    const packages = listWorkspacePackages();
    const order = publishOrder(packages);
    const position = new Map(order.map((name, index) => [name, index]));
    for (const pkg of packages.values()) {
      for (const dep of pkg.workspaceDeps) {
        if (!packages.has(dep)) {
          continue;
        }
        expect(
          position.get(dep),
          `${dep} must publish before ${pkg.name}`,
        ).toBeLessThan(position.get(pkg.name)!);
      }
    }
  });
});
