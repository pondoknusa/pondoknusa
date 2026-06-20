import type { Application } from './application.js';
import type { AuthManager } from '@tyravel/auth';
import type { Authenticatable } from '@tyravel/auth';

let authApplication: Application | undefined;

export function setAuthApplication(app: Application): void {
  authApplication = app;
}

function resolveAuth(): AuthManager {
  if (!authApplication) {
    throw new Error(
      'Auth facade requires an application. Call setAuthApplication(app) during bootstrap.',
    );
  }

  return authApplication.make<AuthManager>('auth');
}

export interface AuthFacade {
  user(): Authenticatable | null;
  id(): string | number | null;
  check(): boolean;
  attempt(credentials: Record<string, string>): Promise<boolean>;
  login(user: Authenticatable): Promise<void>;
  logout(): Promise<void>;
}

export const Auth: AuthFacade = {
  user: () => resolveAuth().user(),
  id: () => resolveAuth().id(),
  check: () => resolveAuth().check(),
  attempt: (credentials) => resolveAuth().attempt(credentials),
  login: (user) => resolveAuth().login(user),
  logout: () => resolveAuth().logout(),
};