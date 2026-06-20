import {
  Application,
  ConfigServiceProvider,
  DatabaseServiceProvider,
  HttpKernel,
  setRouteApplication,
  setViewApplication,
  ViewServiceProvider,
  serve,
} from '@tyravel/core';
import { AppServiceProvider } from './providers/app-service-provider.js';
import './routes/web.js';

const app = new Application(import.meta.dir);
setRouteApplication(app);
setViewApplication(app);

app.register(ConfigServiceProvider);
app.register(DatabaseServiceProvider);
app.register(ViewServiceProvider);
app.register(AppServiceProvider);

await app.boot();

const kernel = new HttpKernel(app);
await serve(kernel);