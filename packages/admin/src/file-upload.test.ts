import { describe, expect, it } from 'vitest';
import { parseAdminInputWithFiles } from './file-upload.js';
import type { AdminField } from './types.js';
import { PondoknusaRequest } from '@pondoknusa/http';

describe('parseAdminInputWithFiles', () => {
  it('rejects uploads over maxBytes', async () => {
    const fields: AdminField[] = [
      {
        name: 'avatar',
        type: 'file',
        file: { maxBytes: 8, allowedExtensions: ['.txt'] },
      },
    ];

    const form = new FormData();
    form.append('avatar', new File(['0123456789'], 'note.txt', { type: 'text/plain' }));

    const request = new PondoknusaRequest(
      new Request('http://localhost/admin', {
        method: 'POST',
        body: form,
      }),
    );

    await expect(
      parseAdminInputWithFiles(request, fields, {
        put: async () => undefined,
        url: (path) => `/${path}`,
      }),
    ).rejects.toThrow(/exceeds the maximum size/);
  });

  it('rejects disallowed extensions', async () => {
    const fields: AdminField[] = [
      {
        name: 'avatar',
        type: 'file',
        file: { allowedExtensions: ['.png'] },
      },
    ];

    const form = new FormData();
    form.append('avatar', new File(['x'], 'note.exe', { type: 'application/octet-stream' }));

    const request = new PondoknusaRequest(
      new Request('http://localhost/admin', {
        method: 'POST',
        body: form,
      }),
    );

    await expect(
      parseAdminInputWithFiles(request, fields, {
        put: async () => undefined,
        url: (path) => `/${path}`,
      }),
    ).rejects.toThrow(/disallowed extension/);
  });
});
