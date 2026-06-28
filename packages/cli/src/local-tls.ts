import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathExists } from './utils.js';

export interface LocalTlsPaths {
  certPath: string;
  keyPath: string;
}

export async function ensureLocalTlsCerts(root: string): Promise<LocalTlsPaths> {
  const directory = join(root, 'storage', 'framework', 'tls');
  const certPath = join(directory, 'localhost.crt');
  const keyPath = join(directory, 'localhost.key');

  if (await pathExists(certPath) && await pathExists(keyPath)) {
    return { certPath, keyPath };
  }

  await mkdir(directory, { recursive: true });

  const result = spawnSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-keyout',
      keyPath,
      '-out',
      certPath,
      '-days',
      '365',
      '-nodes',
      '-subj',
      '/CN=localhost',
    ],
    { stdio: 'pipe' },
  );

  if (result.status !== 0) {
    const message = result.stderr?.toString().trim()
      || 'openssl failed — install OpenSSL to use --tls';
    throw new Error(message);
  }

  return { certPath, keyPath };
}