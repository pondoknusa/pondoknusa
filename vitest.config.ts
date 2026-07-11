import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'scripts/**/*.test.ts'],
    alias: {
      '@pondoknusa/collection': fileURLToPath(new URL('./packages/collection/src/index.ts', import.meta.url)),
      '@pondoknusa/views': fileURLToPath(new URL('./packages/views/src/index.ts', import.meta.url)),
      '@pondoknusa/telegram': fileURLToPath(new URL('./packages/telegram/src/index.ts', import.meta.url)),
      '@pondoknusa/telegram-2fa': fileURLToPath(new URL('./packages/telegram-2fa/src/index.ts', import.meta.url)),
      '@pondoknusa/auth-passkey': fileURLToPath(new URL('./packages/auth-passkey/src/index.ts', import.meta.url)),
    },
  },
});