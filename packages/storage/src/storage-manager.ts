import { LocalDisk } from './local-disk.js';
import { S3Disk } from './s3-disk.js';
import type { DiskConfig, Filesystem, StorageConfig } from './types.js';

export class StorageManager {
  private readonly disks = new Map<string, Filesystem>();

  constructor(private readonly config: StorageConfig) {}

  disk(name?: string): Filesystem {
    const diskName = name ?? this.config.default;
    const existing = this.disks.get(diskName);
    if (existing) {
      return existing;
    }

    const config = this.config.disks[diskName];
    if (!config) {
      throw new Error(`Storage disk [${diskName}] is not configured.`);
    }

    const disk = this.buildDisk(config);
    this.disks.set(diskName, disk);
    return disk;
  }

  private buildDisk(config: DiskConfig): Filesystem {
    switch (config.driver) {
      case 'local':
        return new LocalDisk(config.root);
      case 's3':
        return new S3Disk(config);
      default:
        throw new Error('Unsupported storage driver.');
    }
  }
}