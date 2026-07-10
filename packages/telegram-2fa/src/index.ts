// ── Types ────────────────────────────────────────────────────
export type {
  Telegram2FaConfig,
  TwoFactorCodePayload,
  TwoFactorVerifyResult,
  TelegramChatIdResolver,
  TwoFactorUser,
} from './types.js';

// ── Code generator ──────────────────────────────────────────
export { generateCode, hashCode, constantTimeEqual } from './code-generator.js';
export type { CodePair } from './code-generator.js';

// ── Two-factor manager ──────────────────────────────────────
export { TwoFactorManager, TwoFactorError } from './two-factor-manager.js';

// ── Service provider ─────────────────────────────────────────
export {
  Telegram2FaServiceProvider,
  TWO_FACTOR_MANAGER,
  TWO_FACTOR_CONFIG,
} from './telegram-2fa-service-provider.js';

// ── Middleware ───────────────────────────────────────────────
export { createRequireTwoFactorMiddleware } from './two-factor-middleware.js';
export type { RequireTwoFactorOptions } from './two-factor-middleware.js';

// ── Facade ───────────────────────────────────────────────────
export { TwoFactor } from './facade.js';