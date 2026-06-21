export interface Filesystem {
  put(path: string, contents: string | Buffer): Promise<void>;
  get(path: string): Promise<Buffer | null>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<boolean>;
  url(path: string): string;
}

export interface LocalDiskConfig {
  driver: 'local';
  root: string;
}

export interface S3DiskConfig {
  driver: 's3';
  key: string;
  secret: string;
  region: string;
  bucket: string;
  url?: string;
  endpoint?: string;
}

export type DiskConfig = LocalDiskConfig | S3DiskConfig;

export interface StorageConfig {
  default: string;
  disks: Record<string, DiskConfig>;
}