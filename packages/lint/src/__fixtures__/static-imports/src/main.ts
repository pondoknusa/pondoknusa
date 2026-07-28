import {
  Application,
  AuthServiceProvider,
  ConfigRepository,
  ConfigServiceProvider,
  prepareHttpServer,
  setAuthApplication,
  setRouteApplication,
} from '@pondoknusa/core';
import { AppServiceProvider } from './providers/app-service-provider.js';
import './routes/api.js';
import './routes/auth.js';

const app = new Application(import.meta.dirname);
setRouteApplication(app);
setAuthApplication(app);

app.register(ConfigServiceProvider);
app.register(AuthServiceProvider);
app.register(AppServiceProvider);

await app.boot();

await prepareHttpServer(app, app.make(ConfigRepository));
