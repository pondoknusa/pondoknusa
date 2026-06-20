import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HttpKernel } from '../http-kernel.js';

export async function serveWithNode(
  kernel: HttpKernel,
  hostname: string,
  port: number,
): Promise<{ hostname: string; port: number; close: () => Promise<void> }> {
  return createNodeServer(kernel, hostname, port);
}

async function createNodeServer(
  kernel: HttpKernel,
  hostname: string,
  port: number,
) {
  const { createServer } = await import('node:http');

  const server = createServer(async (incoming, outgoing) => {
    try {
      const request = await toFetchRequest(incoming);
      const response = await kernel.handle(request);
      await writeFetchResponse(outgoing, response);
    } catch (error) {
      console.error(error);
      outgoing.statusCode = 500;
      outgoing.end('Server Error');
    }
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
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function toFetchRequest(incoming: IncomingMessage): Promise<Request> {
  const host = incoming.headers.host ?? 'localhost';
  const url = new URL(incoming.url ?? '/', `http://${host}`);
  const method = incoming.method ?? 'GET';
  const headers = new Headers();

  for (const [key, value] of Object.entries(incoming.headers)) {
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

  const init: RequestInit = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    const body = await readIncomingBody(incoming);
    if (body.length > 0) {
      init.body = Buffer.from(body);
    }
  }

  return new Request(url, init);
}

async function readIncomingBody(incoming: IncomingMessage): Promise<Uint8Array> {
  const chunks: Buffer[] = [];

  for await (const chunk of incoming) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function writeFetchResponse(
  outgoing: ServerResponse,
  response: Response,
): Promise<void> {
  outgoing.statusCode = response.status;

  response.headers.forEach((value, key) => {
    outgoing.setHeader(key, value);
  });

  if (response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    outgoing.end(buffer);
    return;
  }

  outgoing.end();
}