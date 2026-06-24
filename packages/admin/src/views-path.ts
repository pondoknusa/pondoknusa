import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ADMIN_VIEWS_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../resources/views',
);