import {
  Application,
  AuthServiceProvider,
  ConfigRepository,
  ConfigServiceProvider,
  registerHttpMiddleware,
  setAuthApplication,
  setRouteApplication,
} from '@pondoknusa/core';
import { AppServiceProvider } from './providers/app-service-provider.js';

const app = new Application(import.meta.dirname);
setRouteApplication(app);
setAuthApplication(app);

app.register(ConfigServiceProvider);
app.register(AuthServiceProvider);
app.register(AppServiceProvider);

await app.boot();

registerHttpMiddleware(app, app.make(ConfigRepository));

const { registerRoutes } = await import('./routes/index.js');
registerRoutes();
