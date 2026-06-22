import { describe, expect, it } from 'vitest';
import { S3Disk } from './s3-disk.js';

describe('S3Disk', () => {
  it('builds the default public object URL', () => {
    const disk = new S3Disk({
      driver: 's3',
      key: 'test-key',
      secret: 'test-secret',
      region: 'us-east-1',
      bucket: 'my-bucket',
    });

    expect(disk.url('photos/cat.jpg')).toBe(
      'https://my-bucket.s3.us-east-1.amazonaws.com/photos/cat.jpg',
    );
  });

  it('generates presigned temporary URLs', async () => {
    const disk = new S3Disk({
      driver: 's3',
      key: 'test-key',
      secret: 'test-secret',
      region: 'us-east-1',
      bucket: 'my-bucket',
    });

    const url = await disk.temporaryUrl('photos/cat.jpg', 300);
    expect(url).toContain('my-bucket');
    expect(url).toContain('photos/cat.jpg');
    expect(url).toContain('X-Amz-Algorithm');
    expect(url).toContain('X-Amz-Expires=300');
  });
});