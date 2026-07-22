import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import type { Http2SecureServer } from 'node:http2';
import type { Socket } from 'node:net';
import { attachRequestPathname, getFactoryBufferBody, getFactoryStringBody } from '@pondoknusa/http';
import type { HttpKernel } from '../http-kernel.js';

export interface NodeServeOptions {
  tls?: {
    certPath: string;
    keyPath: string;
  };
  http2?: boolean;
}

export async function serveWithNode(
  kernel: HttpKernel,
  hostname: string,
  port: number,
  options: NodeServeOptions = {},
): Promise<{ hostname: string; port: number; close: () => Promise<void> }> {
  return createNodeServer(kernel, hostname, port, options);
}

async function createNodeServer(
  kernel: HttpKernel,
  hostname: string,
  port: number,
  options: NodeServeOptions = {},
) {
  const { readFileSync } = await import('node:fs');
  const { attachBroadcastWebSocketUpgrade } = await import('@pondoknusa/broadcasting');

  let isShuttingDown = false;
  const connections = new Set<Socket>();
  const scheme = options.tls ? 'https' : 'http';

  const requestListener = async (incoming: IncomingMessage, outgoing: ServerResponse) => {
    try {
      if (isShuttingDown) {
        outgoing.setHeader('Connection', 'close');
        outgoing.statusCode = 503;
        outgoing.end('Service Unavailable');
        return;
      }

      const request = await toFetchRequest(incoming, scheme);
      const response = await kernel.handle(request);

      if (isShuttingDown) {
        response.headers.set('Connection', 'close');
      }

      await writeFetchResponse(outgoing, response);
    } catch (error) {
      console.error(error);
      outgoing.statusCode = 500;
      outgoing.end('Server Error');
    }
  };

  const server: HttpServer | HttpsServer | Http2SecureServer = options.tls
    ? options.http2
      ? (await import('node:http2')).createSecureServer(
          {
            cert: readFileSync(options.tls.certPath),
            key: readFileSync(options.tls.keyPath),
            allowHTTP1: true,
          },
          requestListener as unknown as Parameters<
            typeof import('node:http2').createSecureServer
          >[1],
        )
      : (await import('node:https')).createServer(
          {
            cert: readFileSync(options.tls.certPath),
            key: readFileSync(options.tls.keyPath),
          },
          requestListener,
        )
    : (await import('node:http')).createServer(requestListener);

  if (!options.http2) {
    attachBroadcastWebSocketUpgrade(server as HttpServer | HttpsServer);
  }

  // Sensible defaults behind reverse proxies (Fly, Railway, nginx).
  if ('keepAliveTimeout' in server) {
    server.keepAliveTimeout = 5_000;
    server.headersTimeout = 6_000;
  }

  server.on('connection', (socket) => {
    connections.add(socket);
    (socket as { _activeRequests?: number })._activeRequests = 0;
    socket.on('close', () => {
      connections.delete(socket);
    });
  });

  server.on('request', (incoming, outgoing) => {
    const socket = incoming.socket as Socket & { _activeRequests?: number };
    socket._activeRequests = (socket._activeRequests ?? 0) + 1;

    let decremented = false;
    const decrement = () => {
      if (decremented) {
        return;
      }
      decremented = true;
      socket._activeRequests = Math.max(0, (socket._activeRequests ?? 0) - 1);
      if (isShuttingDown && socket._activeRequests === 0) {
        socket.end();
      }
    };

    outgoing.on('finish', decrement);
    outgoing.on('close', decrement);
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, hostname, () => resolve());
    server.on('error', reject);
  });

  const address = server.address();
  const resolvedHost = typeof address === 'object' && address ? address.address : hostname;
  const resolvedPort = typeof address === 'object' && address ? address.port : port;

  return {
    hostname: resolvedHost,
    port: resolvedPort,
    close: async () => {
      isShuttingDown = true;

      const closePromise = new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });

      for (const socket of connections) {
        const active = (socket as Socket & { _activeRequests?: number })._activeRequests ?? 0;
        if (active === 0) {
          socket.end();
        }
      }

      let timeout: NodeJS.Timeout | undefined;
      if (connections.size > 0) {
        timeout = setTimeout(() => {
          for (const socket of connections) {
            socket.destroy();
          }
        }, 5000);
      }

      try {
        await closePromise;
      } finally {
        if (timeout) {
          clearTimeout(timeout);
        }
      }
    },
  };
}

const DEFAULT_MAX_BODY_BYTES = 10 * 1024 * 1024;
const REMOTE_ADDRESS_HEADER = 'x-pondoknusa-remote-address';

async function toFetchRequest(incoming: IncomingMessage, scheme: string): Promise<Request> {
  const method = incoming.method ?? 'GET';
  const { url, pathname } = resolveRequestUrl(incoming, scheme);
  const headers = new Headers();

  for (const key in incoming.headers) {
    const value = incoming.headers[key];
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }
    headers.set(key, value);
  }

  const remoteAddress = incoming.socket.remoteAddress;
  if (remoteAddress) {
    headers.set(REMOTE_ADDRESS_HEADER, remoteAddress);
  }

  let request: Request;
  if (method === 'GET' || method === 'HEAD') {
    request = new Request(url, { method, headers });
  } else {
    const init: RequestInit = { method, headers };
    const body = await readIncomingBody(incoming);
    if (body.length > 0) {
      init.body = Buffer.from(body);
    }
    request = new Request(url, init);
  }

  return attachRequestPathname(request, pathname);
}

function resolveRequestUrl(
  incoming: IncomingMessage,
  scheme: string,
): { url: string; pathname: string } {
  const host = incoming.headers.host ?? 'localhost';
  const target = incoming.url ?? '/';

  // Origin-form (the common case) needs no URL parser: the pathname is the
  // request target up to the query string.
  if (target.startsWith('/')) {
    const queryIndex = target.indexOf('?');
    return {
      url: `${scheme}://${host}${target}`,
      pathname: queryIndex === -1 ? target : target.slice(0, queryIndex),
    };
  }

  const parsed = new URL(target, `${scheme}://${host}`);
  return { url: parsed.href, pathname: parsed.pathname };
}

async function readIncomingBody(incoming: IncomingMessage): Promise<Uint8Array> {
  const maxBytes = resolveMaxBodyBytes(incoming);
  const contentLength = Number(incoming.headers['content-length'] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error('Request body too large');
  }

  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of incoming) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      incoming.destroy();
      throw new Error('Request body too large');
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function resolveMaxBodyBytes(incoming: IncomingMessage): number {
  const configured = Number(process.env.PONDOKNUSA_MAX_BODY_BYTES);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }
  return DEFAULT_MAX_BODY_BYTES;
}

async function writeFetchResponse(
  outgoing: ServerResponse,
  response: Response,
): Promise<void> {
  outgoing.statusCode = response.status;

  response.headers.forEach((value, key) => {
    outgoing.setHeader(key, value);
  });

  // Fast path: factory-created responses carry their body string — skip the
  // ReadableStream read entirely and emit a Content-Length header so the
  // server avoids chunked transfer encoding.
  const knownBody = getFactoryStringBody(response);
  if (knownBody !== undefined) {
    if (knownBody.length === 0) {
      outgoing.end();
      return;
    }
    if (!response.headers.has('content-length')) {
      outgoing.setHeader('content-length', Buffer.byteLength(knownBody));
    }
    outgoing.end(knownBody);
    return;
  }

  // Binary fast path (e.g. compressed bodies) — must run before the JSON
  // text() branch, which would corrupt binary data with UTF-8 decoding.
  const knownBuffer = getFactoryBufferBody(response);
  if (knownBuffer !== undefined) {
    if (knownBuffer.byteLength === 0) {
      outgoing.end();
      return;
    }
    if (!response.headers.has('content-length')) {
      outgoing.setHeader('content-length', knownBuffer.byteLength);
    }
    outgoing.end(knownBuffer);
    return;
  }

  if (!response.body) {
    outgoing.end();
    return;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await response.text();
    if (body.length === 0) {
      outgoing.end();
      return;
    }
    if (!response.headers.has('content-length')) {
      outgoing.setHeader('content-length', Buffer.byteLength(body));
    }
    outgoing.end(body);
    return;
  }

  const reader = response.body.getReader();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      if (value.byteLength > 0) {
        outgoing.write(Buffer.from(value));
      }
    }

    outgoing.end();
  } catch (error) {
    outgoing.destroy(error instanceof Error ? error : new Error(String(error)));
  } finally {
    reader.releaseLock();
  }
}