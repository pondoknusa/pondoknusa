import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import type { PondoknusaRequest } from './request.js';
import { getFactoryStringBody, trackBufferBody, trackStringBody } from './response.js';
import type { Middleware } from './types.js';

const WebResponse = globalThis.Response;

export interface CompressionOptions {
  /** Minimum uncompressed body size in bytes. Default: 1024. */
  threshold?: number;
  /**
   * Brotli quality (0–11) for dynamic responses. Default: 4 — comparable
   * speed to gzip with a better ratio. Higher values suit pre-compressed
   * static assets, not per-request work.
   */
  brotliQuality?: number;
  /** Return `false` to skip compression for a specific request/response. */
  filter?: (request: PondoknusaRequest, response: Response) => boolean;
}

const DEFAULT_THRESHOLD = 1024;
const DEFAULT_BROTLI_QUALITY = 4;

/**
 * Brotli/gzip compression for factory-built responses (`Response.html`,
 * `Response.json`, `Response.text`, …).
 *
 * Streaming bodies (`Response.ssrStream`, `Response.streamHtml`, SSE) are
 * passed through untouched so progressive rendering keeps its early-flush
 * semantics. Compress streams at the CDN/reverse-proxy layer instead.
 */
export function createCompressionMiddleware(options: CompressionOptions = {}): Middleware {
  const threshold = Math.max(0, options.threshold ?? DEFAULT_THRESHOLD);
  const brotliQuality = options.brotliQuality ?? DEFAULT_BROTLI_QUALITY;

  return async (request, next) => {
    if (request.method === 'HEAD') {
      return next();
    }

    const response = await next();

    if (response.status < 200 || response.status >= 300) {
      return response;
    }
    if (response.headers.has('content-encoding')) {
      return response;
    }
    if (!isCompressibleType(response.headers.get('content-type'))) {
      return response;
    }
    if ((response.headers.get('cache-control') ?? '').includes('no-transform')) {
      return response;
    }
    if (options.filter && !options.filter(request, response)) {
      return response;
    }

    const body = getFactoryStringBody(response);
    if (body === undefined) {
      // Hand-built or streaming body — leave it alone.
      return response;
    }

    const size = Buffer.byteLength(body);
    const encoding = size >= threshold
      ? negotiateEncoding(request.headers.get('accept-encoding'))
      : null;

    if (!encoding) {
      if (size < threshold) {
        // Size is client-independent, so no Vary split can occur.
        return response;
      }

      // Identity variant of a URL that also produces compressed variants.
      const headers = copyHeadersWithVary(response.headers);
      return trackStringBody(
        new WebResponse(body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        }),
        body,
      );
    }

    const raw = Buffer.from(body, 'utf8');
    const compressed = encoding === 'br'
      ? brotliCompressSync(raw, {
        params: { [constants.BROTLI_PARAM_QUALITY]: brotliQuality },
      })
      : gzipSync(raw);

    const headers = copyHeadersWithVary(response.headers);
    headers.set('content-encoding', encoding);
    headers.set('content-length', String(compressed.byteLength));
    weakenEtag(headers);

    return trackBufferBody(
      new WebResponse(compressed, {
        status: response.status,
        statusText: response.statusText,
        headers,
      }),
      compressed,
    );
  };
}

function isCompressibleType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }
  // SSE must flush every event raw; compressing breaks delivery timing.
  if (contentType.includes('text/event-stream')) {
    return false;
  }
  return (
    contentType.startsWith('text/')
    || contentType.includes('json')
    || contentType.includes('javascript')
    || contentType.includes('xml')
    || contentType.includes('image/svg+xml')
  );
}

/** Parses `Accept-Encoding`, preferring Brotli on ties. Respects `q=0`. */
function negotiateEncoding(header: string | null): 'br' | 'gzip' | null {
  if (!header) {
    return null;
  }

  let br = 0;
  let gzip = 0;
  let star = 0;

  for (const part of header.split(',')) {
    const [name, ...params] = part.trim().split(';');
    let q = 1;
    for (const param of params) {
      const match = param.trim().match(/^q=([0-9.]+)$/);
      if (match) {
        q = Number(match[1]);
      }
    }

    const token = (name ?? '').trim().toLowerCase();
    if (token === 'br') {
      br = q;
    } else if (token === 'gzip') {
      gzip = q;
    } else if (token === '*') {
      star = q;
    }
  }

  br = br || star;
  gzip = gzip || star;

  if (br > 0 && br >= gzip) {
    return 'br';
  }
  if (gzip > 0) {
    return 'gzip';
  }
  return null;
}

function copyHeadersWithVary(source: Headers): Headers {
  const headers = new Headers(source);
  const existing = headers.get('vary');

  if (!existing) {
    headers.set('vary', 'accept-encoding');
    return headers;
  }

  const tokens = existing.split(',').map((token) => token.trim().toLowerCase());
  if (!tokens.includes('*') && !tokens.includes('accept-encoding')) {
    headers.set('vary', `${existing}, accept-encoding`);
  }

  return headers;
}

/** Body bytes change under compression, so strong validators must weaken. */
function weakenEtag(headers: Headers): void {
  const etag = headers.get('etag');
  if (etag && !etag.startsWith('W/')) {
    headers.set('etag', `W/${etag}`);
  }
}
