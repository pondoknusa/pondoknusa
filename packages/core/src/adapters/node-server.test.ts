import { describe, expect, it } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { get as httpGet } from 'node:http';
import { createCompressionMiddleware, Response } from '@pondoknusa/http';
import { Application } from '../application.js';
import { HttpKernel } from '../http-kernel.js';
import { Route, setRouteApplication } from '../route.js';
import { serve } from '../server.js';

describe('node server streaming', () => {
  it('flushes html chunks before the stream completes', async () => {
    const app = new Application();
    setRouteApplication(app);

    Route.get('/stream', () =>
      Response.streamHtml(
        (async function* () {
          yield '<html><body><main>First</main>';
          await new Promise((resolve) => setTimeout(resolve, 40));
          yield '<aside>Second</aside></body></html>';
        })(),
      ),
    );

    const kernel = new HttpKernel(app);
    const server = await serve(kernel, { port: 0, hostname: '127.0.0.1' });
    const url = `http://${server.hostname}:${server.port}/stream`;

    try {
      const response = await fetch(url);
      expect(response.ok).toBe(true);

      const reader = response.body?.getReader();
      expect(reader).toBeDefined();

      const decoder = new TextDecoder();
      let received = '';

      const first = await reader!.read();
      received += decoder.decode(first.value);
      expect(received).toContain('<main>First</main>');
      expect(received).not.toContain('<aside>Second</aside>');

      const second = await reader!.read();
      received += decoder.decode(second.value);
      expect(received).toContain('<aside>Second</aside>');
    } finally {
      await server.close();
    }
  });
});

describe('node server compression', () => {
  const PAGE = `<!doctype html><html><body>${'<p>compressible</p>'.repeat(300)}</body></html>`;

  it('serves gzip-encoded HTML that survives the binary write path', async () => {
    const app = new Application();
    setRouteApplication(app);
    app.use(createCompressionMiddleware());

    Route.get('/page', () => Response.html(PAGE));
    Route.get('/api/data', () => Response.json({ big: 'x'.repeat(4_096) }));

    const kernel = new HttpKernel(app);
    const server = await serve(kernel, { port: 0, hostname: '127.0.0.1' });

    try {
      const raw = await new Promise<{ headers: Record<string, unknown>; body: Buffer }>(
        (resolve, reject) => {
          httpGet(
            `http://${server.hostname}:${server.port}/page`,
            { headers: { 'accept-encoding': 'gzip' } },
            (incoming) => {
              const chunks: Buffer[] = [];
              incoming.on('data', (chunk) => chunks.push(chunk));
              incoming.on('end', () =>
                resolve({ headers: incoming.headers, body: Buffer.concat(chunks) }),
              );
              incoming.on('error', reject);
            },
          ).on('error', reject);
        },
      );

      expect(raw.headers['content-encoding']).toBe('gzip');
      expect(raw.headers['vary']).toContain('accept-encoding');
      expect(gunzipSync(raw.body).toString()).toBe(PAGE);

      // Compressed JSON takes the same binary path through the adapter.
      const json = await (await fetch(
        `http://${server.hostname}:${server.port}/api/data`,
      )).json();
      expect(json).toEqual({ big: 'x'.repeat(4_096) });
    } finally {
      await server.close();
    }
  });
});