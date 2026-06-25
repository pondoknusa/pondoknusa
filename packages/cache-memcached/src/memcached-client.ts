import { connect, type Socket } from 'node:net';

export interface MemcachedClientOptions {
  host: string;
  port?: number;
}

export class MemcachedClient {
  constructor(private readonly options: MemcachedClientOptions) {}

  async get(key: string): Promise<string | null> {
    const response = await this.command(`get ${key}\r\n`);
    const lines = response.split('\r\n');
    if (lines[0] === 'END' || lines[0]?.startsWith('END')) {
      return null;
    }
    if (lines[0]?.startsWith('VALUE')) {
      return lines[1] ?? null;
    }
    return null;
  }

  async set(key: string, value: string, ttlSeconds = 0): Promise<void> {
    const bytes = Buffer.byteLength(value, 'utf8');
    await this.command(`set ${key} 0 ${ttlSeconds} ${bytes}\r\n${value}\r\n`);
  }

  async add(key: string, value: string, ttlSeconds = 0): Promise<boolean> {
    const bytes = Buffer.byteLength(value, 'utf8');
    const response = await this.command(`add ${key} 0 ${ttlSeconds} ${bytes}\r\n${value}\r\n`);
    return response.startsWith('STORED');
  }

  async delete(key: string): Promise<boolean> {
    const response = await this.command(`delete ${key}\r\n`);
    return response.startsWith('DELETED');
  }

  async flushAll(): Promise<void> {
    await this.command('flush_all\r\n');
  }

  private command(payload: string): Promise<string> {
    return withSocket(this.options.host, this.options.port ?? 11211, async (socket) => {
      socket.write(payload);
      return readResponse(socket);
    });
  }
}

function withSocket<T>(host: string, port: number, callback: (socket: Socket) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port });
    socket.once('error', reject);
    socket.once('connect', async () => {
      try {
        resolve(await callback(socket));
      } catch (error) {
        reject(error);
      } finally {
        socket.end();
      }
    });
  });
}

function readResponse(socket: Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    socket.on('data', (chunk: Buffer) => chunks.push(chunk));
    socket.on('error', reject);
    socket.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}