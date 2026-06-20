import { serveWithNode } from './adapters/node-server.js';
import type { HttpKernel } from './http-kernel.js';

export interface ServeOptions {
  port?: number;
  hostname?: string;
}

interface BunServe {
  serve(options: {
    hostname: string;
    port: number;
    fetch: (request: Request) => Response | Promise<Response>;
  }): { hostname: string; port: number };
}

export async function serve(kernel: HttpKernel, options: ServeOptions = {}): Promise<void> {
  const port = options.port ?? (Number(process.env.TYRAVEL_PORT) || 3000);
  const hostname = options.hostname ?? (process.env.TYRAVEL_HOST || '127.0.0.1');
  const bun = (globalThis as { Bun?: BunServe }).Bun;

  if (bun) {
    const server = bun.serve({
      hostname,
      port,
      fetch: (request) => kernel.handle(request),
    });

    console.log(`Tyravel server running at http://${server.hostname}:${server.port}`);
    return;
  }

  const server = await serveWithNode(kernel, hostname, port);
  console.log(`Tyravel server running at http://${server.hostname}:${server.port}`);
}