import { timingSafeEqual } from 'node:crypto';
import {
  cachedFormData,
  HttpException,
  withMiddlewareMeta,
  type Middleware,
  type PondoknusaRequest,
} from '@pondoknusa/http';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const MAX_PATH_LENGTH = 4096;

export type CsrfFailureCode = 'CSRF_SESSION_TOKEN_MISSING' | 'CSRF_TOKEN_MISMATCH';

export class VerifyCsrfTokenException extends HttpException {
  readonly code: CsrfFailureCode;

  constructor(
    message = 'CSRF token mismatch.',
    code: CsrfFailureCode = 'CSRF_TOKEN_MISMATCH',
  ) {
    super(message, 419);
    this.name = 'VerifyCsrfTokenException';
    this.code = code;
  }
}

export interface VerifyCsrfTokenOptions {
  except?: string[];
}

export function createVerifyCsrfTokenMiddleware(
  options: VerifyCsrfTokenOptions = {},
): Middleware {
  const except = options.except ?? [];
  const compiledPatterns = except.map((pattern) => compilePathPattern(pattern));

  return withMiddlewareMeta(async (request, next) => {
    if (SAFE_METHODS.has(request.method)) {
      return next();
    }

    if (isExcepted(request.path, compiledPatterns)) {
      return next();
    }

    const sessionToken = request.session?.get<string>('_csrf_token');
    if (!sessionToken) {
      throw new VerifyCsrfTokenException(
        'CSRF session token missing.',
        'CSRF_SESSION_TOKEN_MISSING',
      );
    }

    const submitted = await readSubmittedToken(request);
    if (!submitted || !tokensMatch(sessionToken, submitted)) {
      throw new VerifyCsrfTokenException(
        'CSRF token mismatch.',
        'CSRF_TOKEN_MISMATCH',
      );
    }

    return next();
  }, { tag: 'csrf' });
}

function readSubmittedToken(request: PondoknusaRequest): Promise<string | undefined> {
  const header = request.header('x-csrf-token') ?? request.header('X-CSRF-TOKEN');
  if (header) {
    return Promise.resolve(header);
  }

  const cached = cachedFormData(request)?.get('_token');
  if (typeof cached === 'string') {
    return Promise.resolve(cached);
  }

  return request.input<string>('_token');
}

function tokensMatch(expected: string, submitted: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(submitted, 'utf8');
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

function isExcepted(path: string, patterns: RegExp[]): boolean {
  if (path.length > MAX_PATH_LENGTH) {
    return false;
  }

  return patterns.some((pattern) => pattern.test(path));
}

/**
 * Compiles a CSRF except path pattern.
 * `*` matches a single path segment; `**` matches any depth (including `/`).
 * Globstars are substituted before single `*` so `/api/**` does not become `/api/.[^/]*`.
 */
export function compilePathPattern(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regexSource = escaped
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  return new RegExp(`^${regexSource}$`);
}
