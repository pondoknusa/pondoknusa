import {
  Application,
  ConfigServiceProvider,
  setRouteApplication,
} from '@pondoknusa/core';
import { AppServiceProvider } from './providers/app-service-provider.js';

const app = new Application(import.meta.dirname);
setRouteApplication(app);

app.register(ConfigServiceProvider);
app.register(AppServiceProvider);

await app.boot();

const { registerRoutes } = await import('./routes/index.js');
registerRoutes();
