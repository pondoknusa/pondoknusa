import { describe, expect, it } from 'vitest';
import { StorageManager } from './storage-manager.js';
import { StorageRepository } from './storage-repository.js';
import type { Filesystem } from './types.js';

class SignedDisk implements Filesystem {
  async put(): Promise<void> {}

  async get(): Promise<Buffer | null> {
    return null;
  }

  async exists(): Promise<boolean> {
    return false;
  }

  async delete(): Promise<boolean> {
    return false;
  }

  url(path: string): string {
    return `/signed/${path}`;
  }

  async temporaryUrl(path: string, expiresInSeconds: number): Promise<string> {
    return `https://signed.test/${path}?expires=${expiresInSeconds}`;
  }
}

describe('StorageRepository', () => {
  it('delegates temporaryUrl to capable disks', async () => {
    StorageManager.extend('signed', () => new SignedDisk());

    const manager = new StorageManager({
      default: 'signed',
      disks: {
        signed: { driver: 'signed' },
      },
    });

    const repository = new StorageRepository(manager);
    await expect(repository.temporaryUrl('secret.txt', 120)).resolves.toBe(
      'https://signed.test/secret.txt?expires=120',
    );
  });

  it('throws when the active disk does not support temporary URLs', async () => {
    const manager = new StorageManager({
      default: 'local',
      disks: {
        local: { driver: 'local', root: process.cwd() },
      },
    });

    const repository = new StorageRepository(manager, 'local');
    await expect(repository.temporaryUrl('secret.txt', 120)).rejects.toThrow(
      'Storage disk [local] does not support temporary URLs.',
    );
  });
});