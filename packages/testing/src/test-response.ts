import type { JsonValue } from './json-match.js';
import { jsonContains } from './json-match.js';

export class TestResponse {
  constructor(public readonly response: Response) {}

  status(): number {
    return this.response.status;
  }

  assertStatus(expected: number): this {
    if (this.response.status !== expected) {
      throw new Error(
        `Expected HTTP status ${expected}, received ${this.response.status}.`,
      );
    }
    return this;
  }

  assertOk(): this {
    return this.assertStatus(200);
  }

  assertNotFound(): this {
    return this.assertStatus(404);
  }

  assertUnauthorized(): this {
    return this.assertStatus(401);
  }

  assertForbidden(): this {
    return this.assertStatus(403);
  }

  assertUnprocessable(): this {
    return this.assertStatus(422);
  }

  async json<T = unknown>(): Promise<T> {
    return this.response.json() as Promise<T>;
  }

  async text(): Promise<string> {
    return this.response.text();
  }

  async assertJson(expected: JsonValue): Promise<this> {
    const body = await this.json();
    if (!jsonContains(body as JsonValue, expected)) {
      throw new Error(
        `JSON response does not contain expected fragment.\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(body)}`,
      );
    }
    return this;
  }

  async assertJsonPath(path: string, expected: unknown): Promise<this> {
    const body = await this.json<Record<string, unknown>>();
    const value = readPath(body, path);
    if (value !== expected) {
      throw new Error(
        `JSON path "${path}" expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`,
      );
    }
    return this;
  }

  header(name: string): string | null {
    return this.response.headers.get(name);
  }
}

function readPath(value: unknown, path: string): unknown {
  const segments = path.split('.').filter(Boolean);
  let current: unknown = value;
  for (const segment of segments) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}