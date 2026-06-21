import type { StorageConfig } from '@tyravel/storage';
import { env } from '@tyravel/config';

export default {
  default: env('FILESYSTEM_DISK', 'local'),
  disks: {
    local: {
      driver: 'local',
      root: 'storage/app',
    },
    s3: {
      driver: 's3',
      key: env('AWS_ACCESS_KEY_ID', ''),
      secret: env('AWS_SECRET_ACCESS_KEY', ''),
      region: env('AWS_DEFAULT_REGION', 'us-east-1'),
      bucket: env('AWS_BUCKET', ''),
      url: env('AWS_URL', ''),
      endpoint: env('AWS_ENDPOINT', ''),
    },
  },
} satisfies StorageConfig;