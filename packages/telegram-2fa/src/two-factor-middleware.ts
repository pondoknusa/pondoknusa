/**
 * @pondoknusa/telegram-2fa — Middleware for 2FA challenge enforcement.
 *
 * Attach to routes or groups that should require a verified 2FA session.
 * The user must have completed a 2FA verification within the session TTL
 * window, otherwise the middleware returns a 403 JSON error or redirects.
 *
 * Usage in routes/web.ts:
 *
 *   import { createRequireTwoFactorMiddleware } from '@pondoknusa/telegram-2fa';
 *
 *   Route.middleware('2fa', createRequireTwoFactorMiddleware()).get('/admin', handler);
 *
 * Or with custom behaviour:
 *
 *   Route.middleware('2fa', createRequireTwoFactorMiddleware({
 *     onChallengeRequired: (request) => Response.json({ error: '2FA required' }, 401),
 *   })).get('/admin', handler);
 *
 * The verification flow:
 *   1. User authenticates (password / session login)
 *   2. Application calls TwoFactor.send(user) to send code via Telegram
 *   3. User submits the code to a verify endpoint
 *   4. Application calls TwoFactor.verify(user, code)
 *   5. On success, mark the session: TwoFactor.markVerified(request, user)
 *   6. The middleware checks this session flag on subsequent requests
 */

import { Response } from '@pondoknusa/http';
import type { Middleware, PondoknusaRequest } from '@pondoknusa/http';
import type { TwoFactorUser } from './types.js';

export interface RequireTwoFactorOptions {
  /**
   * Custom JSON body when 2FA challenge is required.
   * Default: { error: '2FA required', code: '2FA_REQUIRED' }
   */
  onChallengeRequired?: (request: PondoknusaRequest) => Response;

  /**
   * Session key to check for 2FA verification.
   * Default: 'telegram_2fa_verified'
   */
  sessionKey?: string;

  /**
   * Whether to skip 2FA for GET/HEAD requests (allows page loads).
   * The user will get challenged when they try a mutating action.
   * Default: false
   */
  skipSafeMethods?: boolean;
}

/**
 * Create a middleware that requires 2FA verification in the session.
 */
export function createRequireTwoFactorMiddleware(
  options: RequireTwoFactorOptions = {},
): Middleware {
  const sessionKey = options.sessionKey ?? 'telegram_2fa_verified';

  return async (request: PondoknusaRequest, next: () => Promise<Response>) => {
    // Skip safe methods if configured
    if (options.skipSafeMethods && ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return next();
    }

    const user = request.user as TwoFactorUser | null;

    // No authenticated user — let other auth middleware handle it
    if (!user) {
      return next();
    }

    // Check for verified flag in session
    const verified = request.session?.get<number>(sessionKey);
    if (verified) {
      // Check if the verification is still within the TTL window
      const ttl = (options as any).sessionTtl ?? 3600;
      const elapsed = (Date.now() - verified) / 1000;
      if (elapsed < ttl) {
        return next();
      }
      // Session TTL expired — clear and require re-verification
      request.session?.forget(sessionKey);
    }

    // 2FA required
    if (options.onChallengeRequired) {
      return options.onChallengeRequired(request);
    }

    return Response.json(
      {
        error: 'Two-factor authentication required.',
        message: 'Please verify your identity via Telegram.',
        code: '2FA_REQUIRED',
      },
      { status: 403 },
    );
  };
}