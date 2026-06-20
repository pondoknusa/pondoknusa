import { randomBytes } from 'node:crypto';
import type { TyravelRequest } from '@tyravel/http';
import { Response as HttpResponse } from '@tyravel/http';
import type { Middleware } from '@tyravel/http';

type WebResponse = globalThis.Response;
import { AuthenticationException } from './exceptions.js';
import { InvalidCredentialsException } from './exceptions.js';
import { Session } from './session.js';
import type { SessionStore } from './session.js';
import type { UserProvider } from './user-provider.js';
import type { Authenticatable, AuthConfig } from './types.js';

function sessionKey(guard: string): string {
  return `auth.${guard}.user_id`;
}

export class SessionGuard {
  private session?: Session;
  private currentUser: Authenticatable | null = null;
  private request?: TyravelRequest;

  constructor(
    private readonly name: string,
    private readonly provider: UserProvider,
    private readonly store: SessionStore,
    private readonly sessionConfig: AuthConfig['session'],
  ) {}

  setRequest(request: TyravelRequest): void {
    this.request = request;
  }

  async startSession(): Promise<void> {
    if (!this.request) {
      throw new Error('Request not set on guard');
    }

    const cookieName = this.sessionConfig.cookie;
    const existingId = readCookie(this.request, cookieName);
    const id = existingId ?? randomBytes(32).toString('base64url');
    const data = await this.store.read(id);
    this.session = new Session(id, data);
    this.request.session = this.session;

    const userId = this.session.get<string | number>(sessionKey(this.name));
    if (userId !== undefined) {
      this.currentUser = await this.provider.retrieveById(userId);
      this.request.user = this.currentUser;
    } else {
      this.request.user = null;
    }
  }

  async persistSession(response: WebResponse): Promise<WebResponse> {
    if (!this.session) {
      return response;
    }

    if (this.session.isDirty()) {
      await this.store.write(
        this.session.id,
        this.session.all(),
        this.sessionConfig.lifetimeMinutes,
      );
      this.session.markClean();
    }

    const cookieName = this.sessionConfig.cookie;
    const maxAge = this.sessionConfig.lifetimeMinutes * 60;
    return withCookie(response, cookieName, this.session.id, maxAge);
  }

  user(): Authenticatable | null {
    return this.currentUser;
  }

  id(): string | number | null {
    return this.currentUser?.getAuthIdentifier() ?? null;
  }

  check(): boolean {
    return this.currentUser !== null;
  }

  async attempt(credentials: Record<string, string>): Promise<boolean> {
    const user = await this.provider.retrieveByCredentials(credentials);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const valid = await this.provider.validateCredentials(user, credentials);
    if (!valid) {
      throw new InvalidCredentialsException();
    }

    await this.login(user);
    return true;
  }

  async login(user: Authenticatable): Promise<void> {
    this.currentUser = user;
    if (!this.session) {
      throw new Error('Session not started');
    }

    this.session.put(sessionKey(this.name), user.getAuthIdentifier());
    if (this.request) {
      this.request.user = user;
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (this.session) {
      this.session.forget(sessionKey(this.name));
    }
    if (this.request) {
      this.request.user = null;
    }
  }
}

export class AuthManager {
  private readonly guards = new Map<string, SessionGuard>();
  private defaultGuard: string;

  constructor(
    private readonly config: AuthConfig,
    guardFactories: Record<string, () => SessionGuard>,
  ) {
    this.defaultGuard = config.defaults.guard;
    for (const [name, factory] of Object.entries(guardFactories)) {
      this.guards.set(name, factory());
    }
  }

  guard(name?: string): SessionGuard {
    const guardName = name ?? this.defaultGuard;
    const guard = this.guards.get(guardName);
    if (!guard) {
      throw new Error(`Auth guard not configured: ${guardName}`);
    }
    return guard;
  }

  user(): Authenticatable | null {
    return this.guard().user();
  }

  id(): string | number | null {
    return this.guard().id();
  }

  check(): boolean {
    return this.guard().check();
  }

  async attempt(credentials: Record<string, string>, guard?: string): Promise<boolean> {
    return this.guard(guard).attempt(credentials);
  }

  async login(user: Authenticatable, guard?: string): Promise<void> {
    await this.guard(guard).login(user);
  }

  async logout(guard?: string): Promise<void> {
    await this.guard(guard).logout();
  }

  async startRequest(request: TyravelRequest): Promise<void> {
    for (const guard of this.guards.values()) {
      guard.setRequest(request);
    }
    await this.guard().startSession();
  }

  async endRequest(response: WebResponse): Promise<WebResponse> {
    return this.guard().persistSession(response);
  }
}

export function createAuthMiddleware(auth: AuthManager, guard?: string): Middleware {
  return async (_request, next) => {
    if (!auth.guard(guard).check()) {
      throw new AuthenticationException();
    }

    return next();
  };
}

export function createGuestMiddleware(auth: AuthManager, guard?: string): Middleware {
  return async (request, next) => {
    if (auth.guard(guard).check()) {
      return HttpResponse.json({ message: 'Already authenticated.' }, { status: 409 });
    }

    return next();
  };
}

export function createStartSessionMiddleware(auth: AuthManager): Middleware {
  return async (request, next) => {
    await auth.startRequest(request);
    const response = await next();
    return auth.endRequest(response);
  };
}

function readCookie(request: TyravelRequest, name: string): string | undefined {
  const header = request.header('cookie');
  if (!header) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return undefined;
}

function withCookie(
  response: WebResponse,
  name: string,
  value: string,
  maxAge: number,
): WebResponse {
  const headers = new Headers(response.headers);
  headers.append(
    'set-cookie',
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
  );

  return new globalThis.Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}