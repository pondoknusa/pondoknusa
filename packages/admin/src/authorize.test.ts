import { describe, expect, it, vi } from 'vitest';
import { AuthorizationException } from '@pondoknusa/auth';
import { defineAdminResource } from './admin-resource.js';
import { authorizeResourceAbility } from './authorize.js';
import type { ModelStatic } from '@pondoknusa/database';

const model = { name: 'Post', primaryKey: 'id' } as ModelStatic;

describe('authorizeResourceAbility', () => {
  it('requires a policy on the resource', async () => {
    const resource = defineAdminResource('posts', model, {
      fields: [{ name: 'title' }],
    });

    const gate = {
      allows: vi.fn(async () => false),
    };

    await expect(
      authorizeResourceAbility(
        gate as never,
        { user: () => ({ getAuthIdentifier: () => 1 }) } as never,
        resource,
        'viewAny',
      ),
    ).rejects.toBeInstanceOf(AuthorizationException);

    expect(gate.allows).not.toHaveBeenCalled();
  });

  it('throws when policy denies access', async () => {
    class PostPolicy {}

    const resource = defineAdminResource('posts', model, {
      fields: [{ name: 'title' }],
      policy: PostPolicy,
    });

    const gate = {
      allows: vi.fn(async () => false),
    };

    await expect(
      authorizeResourceAbility(
        gate as never,
        { user: () => ({ getAuthIdentifier: () => 1 }) } as never,
        resource,
        'viewAny',
      ),
    ).rejects.toBeInstanceOf(AuthorizationException);
  });
});