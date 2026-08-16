import { describe, expect, it } from 'vitest';
import { createSecurityHeadersMiddleware } from './security-headers.js';
import { PondoknusaRequest } from './request.js';
import { Response } from './response.js';

describe('createSecurityHeadersMiddleware', () => {
  it('applies baseline security headers', async () => {
    const middleware = createSecurityHeadersMiddleware();
    const request = new PondoknusaRequest(new Request('http://localhost/'));
    const response = await middleware(request, async () => Response.html('<p>ok</p>'));

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('allows disabling individual headers', async () => {
    const middleware = createSecurityHeadersMiddleware({ frameOptions: false });
    const request = new PondoknusaRequest(new Request('http://localhost/'));
    const response = await middleware(request, async () => Response.html('<p>ok</p>'));

    expect(response.headers.get('X-Frame-Options')).toBeNull();
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
