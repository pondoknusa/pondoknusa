import { StorageManager } from './storage-manager.js';
import { supportsTemporaryUrls, type Filesystem } from './types.js';

export class StorageRepository implements Filesystem {
  constructor(
    private readonly manager: StorageManager,
    private readonly diskName?: string,
  ) {}

  private disk(): Filesystem {
    return this.manager.disk(this.diskName);
  }

  async put(path: string, contents: string | Buffer): Promise<void> {
    await this.disk().put(path, contents);
  }

  async get(path: string): Promise<Buffer | null> {
    return this.disk().get(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.disk().exists(path);
  }

  async delete(path: string): Promise<boolean> {
    return this.disk().delete(path);
  }

  url(path: string): string {
    return this.disk().url(path);
  }

  async temporaryUrl(path: string, expiresInSeconds: number): Promise<string> {
    const disk = this.disk();
    if (!supportsTemporaryUrls(disk)) {
      const name = this.diskName ?? 'default';
      throw new Error(`Storage disk [${name}] does not support temporary URLs.`);
    }
    return disk.temporaryUrl(path, expiresInSeconds);
  }
}