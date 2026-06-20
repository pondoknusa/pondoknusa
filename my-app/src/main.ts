import {
  Application,
  HttpKernel,
  setRouteApplication,
  serve,
} from '@tyravel/core';
import { AppServiceProvider } from './providers/app-service-provider.js';
import './routes/web.js';

const app = new Application(import.meta.dir);
setRouteApplication(app);

app.register(AppServiceProvider);

await app.boot();

const kernel = new HttpKernel(app);
serve(kernel);
