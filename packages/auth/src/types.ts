import type { Model } from '@tyravel/database';

export interface Authenticatable {
  getAuthIdentifier(): string | number;
  getAuthPassword(): string;
}

export type UserModelConstructor = new (
  attributes?: Record<string, unknown>,
) => Model & Authenticatable;

export interface SessionGuardConfig {
  driver: 'session';
  provider: string;
}

export interface EloquentUserProviderConfig {
  driver: 'eloquent';
  model: UserModelConstructor;
}

export interface AuthConfig {
  defaults: {
    guard: string;
  };
  guards: Record<string, SessionGuardConfig>;
  providers: Record<string, EloquentUserProviderConfig>;
  session: {
    cookie: string;
    lifetimeMinutes: number;
    table: string;
    connection?: string;
  };
}