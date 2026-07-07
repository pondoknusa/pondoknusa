import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'scripts/**/*.test.ts'],
    alias: {
      '@pondoknusa/collection': fileURLToPath(new URL('./packages/collection/src/index.ts', import.meta.url)),
      '@pondoknusa/views': fileURLToPath(new URL('./packages/views/src/index.ts', import.meta.url)),
    },
  },
});