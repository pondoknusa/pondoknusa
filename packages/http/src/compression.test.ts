import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createCompressionMiddleware } from './compression.js';
import { PondoknusaRequest } from './request.js';
import { Response } from './response.js';

const BIG_HTML = `<!doctype html><html><body>${'<p>Hello Pondoknusa</p>'.repeat(200)}</body></html>`;

function htmlRequest(acceptEncoding?: string): PondoknusaRequest {
  return new PondoknusaRequest(
    new Request('http://localhost/page', {
      headers: acceptEncoding ? { 'accept-encoding': acceptEncoding } : {},
    }),
  );
}

async function htmlResponse(): Promise<Response> {
  return Response.html(BIG_HTML);
}

describe('createCompressionMiddleware', () => {
  it('compresses with gzip and round-trips the body', async () => {
    const middleware = createCompressionMiddleware();
    const response = await middleware(htmlRequest('gzip'), htmlResponse);

    expect(response.headers.get('content-encoding')).toBe('gzip');
    expect(response.headers.get('vary')).toBe('accept-encoding');
    const compressed = Buffer.from(await response.arrayBuffer());
    expect(Number(response.headers.get('content-length'))).toBe(compressed.byteLength);
    expect(compressed.byteLength).toBeLessThan(Buffer.byteLength(BIG_HTML) / 5);
    expect(gunzipSync(compressed).toString()).toBe(BIG_HTML);
  });

  it('prefers brotli when the client offers both', async () => {
    const middleware = createCompressionMiddleware();
    const response = await middleware(htmlRequest('gzip, br'), htmlResponse);

    expect(response.headers.get('content-encoding')).toBe('br');
    const compressed = Buffer.from(await response.arrayBuffer());
    expect(brotliDecompressSync(compressed).toString()).toBe(BIG_HTML);
  });

  it('respects q=0 exclusions', async () => {
    const middleware = createCompressionMiddleware();
    const response = await middleware(htmlRequest('br;q=0, gzip'), htmlResponse);

    expect(response.headers.get('content-encoding')).toBe('gzip');
  });

  it('skips bodies below the threshold', async () => {
    const middleware = createCompressionMiddleware();
    const small = Response.json({ ok: true });

    const response = await middleware(htmlRequest('br, gzip'), async () => small);

    expect(response).toBe(small);
    expect(response.headers.get('content-encoding')).toBeNull();
  });

  it('serves an identity variant with Vary when no encoding is offered', async () => {
    const middleware = createCompressionMiddleware();
    const response = await middleware(htmlRequest(), htmlResponse);

    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('vary')).toBe('accept-encoding');
    expect(await response.text()).toBe(BIG_HTML);
  });

  it('does not compress server-sent events', async () => {
    const middleware = createCompressionMiddleware();
    const sse = Response.sse((async function* () {
      yield { data: 'tick' };
    })());

    const response = await middleware(htmlRequest('gzip, br'), async () => sse);

    expect(response).toBe(sse);
    expect(response.headers.get('content-encoding')).toBeNull();
  });

  it('does not double-compress responses that already carry content-encoding', async () => {
    const middleware = createCompressionMiddleware();
    const encoded = Response.make(BIG_HTML, {
      headers: { 'content-type': 'text/html', 'content-encoding': 'gzip' },
    });

    const response = await middleware(htmlRequest('gzip, br'), async () => encoded);

    expect(response).toBe(encoded);
  });

  it('respects cache-control: no-transform', async () => {
    const middleware = createCompressionMiddleware();
    const noTransform = Response.html(BIG_HTML, {
      headers: { 'cache-control': 'public, no-transform' },
    });

    const response = await middleware(htmlRequest('gzip'), async () => noTransform);

    expect(response).toBe(noTransform);
  });

  it('weakens strong etags on compressed variants', async () => {
    const middleware = createCompressionMiddleware();
    const withEtag = Response.html(BIG_HTML, { headers: { etag: '"abc123"' } });

    const response = await middleware(htmlRequest('gzip'), async () => withEtag);

    expect(response.headers.get('etag')).toBe('W/"abc123"');
  });

  it('skips non-compressible content types', async () => {
    const middleware = createCompressionMiddleware();
    const png = Response.make('fake-png-bytes'.repeat(100), {
      headers: { 'content-type': 'image/png' },
    });

    const response = await middleware(htmlRequest('gzip, br'), async () => png);

    expect(response).toBe(png);
  });

  it('passes HEAD requests through untouched', async () => {
    const middleware = createCompressionMiddleware();
    const request = new PondoknusaRequest(
      new Request('http://localhost/page', {
        method: 'HEAD',
        headers: { 'accept-encoding': 'gzip' },
      }),
    );
    const inner = Response.html(BIG_HTML);

    const response = await middleware(request, async () => inner);

    expect(response).toBe(inner);
  });

  it('honors a custom filter', async () => {
    const middleware = createCompressionMiddleware({ filter: () => false });
    const inner = Response.html(BIG_HTML);

    const response = await middleware(htmlRequest('gzip'), async () => inner);

    expect(response).toBe(inner);
  });

  it('leaves streaming responses untouched', async () => {
    const middleware = createCompressionMiddleware();
    const stream = Response.streamHtml((async function* () {
      yield BIG_HTML;
    })());

    const response = await middleware(htmlRequest('gzip, br'), async () => stream);

    expect(response).toBe(stream);
    expect(response.headers.get('content-encoding')).toBeNull();
  });
});
