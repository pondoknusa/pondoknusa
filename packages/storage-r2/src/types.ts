export interface R2DiskConfig {
  driver: 'r2';
  key: string;
  secret: string;
  accountId: string;
  bucket: string;
  url?: string;
}