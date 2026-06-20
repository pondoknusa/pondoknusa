import { ConfigRepository } from '@tyravel/config';
import { DatabaseManager } from '@tyravel/database';
import {
  AuthManager,
  SessionGuard,
  createAuthMiddleware,
  createGuestMiddleware,
  createStartSessionMiddleware,
  DatabaseSessionStore,
  EloquentUserProvider,
  type AuthConfig,
  type EloquentUserProviderConfig,
  type SessionGuardConfig,
} from '@tyravel/auth';
import { ServiceProvider } from './service-provider.js';

export class AuthServiceProvider extends ServiceProvider {
  override register() {
    const config = this.app.make<ConfigRepository>('config');
    const authConfig = config.get<AuthConfig>('auth');
    const database = this.app.make<DatabaseManager>('db');

    const sessionConnection = database.connection(authConfig.session.connection);
    const sessionStore = new DatabaseSessionStore(
      sessionConnection,
      authConfig.session.table,
    );

    const providers = new Map<string, EloquentUserProvider>();
    for (const [name, providerConfig] of Object.entries(
      authConfig.providers,
    ) as [string, EloquentUserProviderConfig][]) {
      providers.set(name, new EloquentUserProvider(providerConfig.model));
    }

    const guardFactories: Record<string, () => SessionGuard> = {};
    for (const [guardName, guardConfig] of Object.entries(
      authConfig.guards,
    ) as [string, SessionGuardConfig][]) {
      const provider = providers.get(guardConfig.provider);
      if (!provider) {
        throw new Error(`Auth provider not configured: ${guardConfig.provider}`);
      }

      guardFactories[guardName] = () =>
        new SessionGuard(
          guardName,
          provider,
          sessionStore,
          authConfig.session,
        );
    }

    const auth = new AuthManager(authConfig, guardFactories);
    this.app.instance('auth', auth);
    this.app.singleton(AuthManager, () => auth);
  }

  override boot() {
    const auth = this.app.make<AuthManager>('auth');

    this.app.use(createStartSessionMiddleware(auth));
    this.app.middleware('auth', createAuthMiddleware(auth));
    this.app.middleware('guest', createGuestMiddleware(auth));
  }
}