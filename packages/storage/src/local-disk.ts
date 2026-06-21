import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import type { Filesystem } from './types.js';

export class LocalDisk implements Filesystem {
  private readonly rootResolved: string;

  constructor(private readonly root: string) {
    this.rootResolved = resolve(root);
  }

  async put(path: string, contents: string | Buffer): Promise<void> {
    const fullPath = this.resolvePath(path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, contents);
  }

  async get(path: string): Promise<Buffer | null> {
    const fullPath = this.resolvePath(path);
    try {
      return await readFile(fullPath);
    } catch {
      return null;
    }
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = this.resolvePath(path);
    try {
      const info = await stat(fullPath);
      return info.isFile();
    } catch {
      return false;
    }
  }

  async delete(path: string): Promise<boolean> {
    const fullPath = this.resolvePath(path);
    try {
      await rm(fullPath, { force: true });
      return true;
    } catch {
      return false;
    }
  }

  url(path: string): string {
    return `/${path.replace(/^\/+/, '')}`;
  }

  private resolvePath(filePath: string): string {
    const fullPath = resolve(this.rootResolved, filePath);
    if (
      fullPath !== this.rootResolved &&
      !fullPath.startsWith(`${this.rootResolved}${sep}`)
    ) {
      throw new Error(`Invalid storage path [${filePath}].`);
    }
    return fullPath;
  }
}