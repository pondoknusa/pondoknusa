import type { HttpKernel } from '@tyravel/core';
import { CookieJar } from './cookie-jar.js';
import { TestResponse } from './test-response.js';

export interface HttpTestOptions {
  headers?: Record<string, string>;
  json?: unknown;
  body?: RequestInit['body'];
}

export class HttpTestClient {
  private readonly jar = new CookieJar();
  private defaultHeaders: Record<string, string> = {
    accept: 'application/json',
  };

  constructor(private readonly kernel: HttpKernel) {}

  withHeaders(headers: Record<string, string>): this {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    return this;
  }

  withToken(plainTextToken: string): this {
    return this.withHeaders({
      authorization: `Bearer ${plainTextToken}`,
    });
  }

  withSessionCookie(name: string, value: string): this {
    this.jar.set(name, value);
    return this;
  }

  async get(url: string, options: HttpTestOptions = {}): Promise<TestResponse> {
    return this.request('GET', url, options);
  }

  async post(url: string, options: HttpTestOptions = {}): Promise<TestResponse> {
    return this.request('POST', url, options);
  }

  async put(url: string, options: HttpTestOptions = {}): Promise<TestResponse> {
    return this.request('PUT', url, options);
  }

  async patch(url: string, options: HttpTestOptions = {}): Promise<TestResponse> {
    return this.request('PATCH', url, options);
  }

  async delete(url: string, options: HttpTestOptions = {}): Promise<TestResponse> {
    return this.request('DELETE', url, options);
  }

  async request(
    method: string,
    url: string,
    options: HttpTestOptions = {},
  ): Promise<TestResponse> {
    const headers = new Headers({ ...this.defaultHeaders, ...options.headers });

    if (options.json !== undefined) {
      headers.set('content-type', 'application/json');
    }

    const cookie = this.jar.headerValue();
    if (cookie) {
      headers.set('cookie', cookie);
    }

    const init: RequestInit = {
      method,
      headers,
      body:
        options.json !== undefined
          ? JSON.stringify(options.json)
          : options.body,
    };

    const response = await this.kernel.handle(new Request(url, init));
    this.jar.absorb(response);
    return new TestResponse(response);
  }

  resetCookies(): void {
    this.jar.clear();
  }
}