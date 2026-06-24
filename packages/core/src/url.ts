import type { RouteParams } from '@tyravel/http';
import type { Application } from './application.js';

let urlApplication: Application | undefined;

export function setUrlApplication(app: Application): void {
  urlApplication = app;
}

function router() {
  if (!urlApplication) {
    throw new Error('URL facade is not ready. Boot the application first.');
  }
  return urlApplication.router();
}

export interface UrlFacade {
  defaults(params: RouteParams): void;
  mergeDefaults(params: RouteParams): void;
  getDefaults(): RouteParams;
  route(name: string, params?: RouteParams): string;
}

export const URL: UrlFacade = {
  defaults: (params) => {
    router().setUrlDefaults(params);
  },
  mergeDefaults: (params) => {
    router().mergeUrlDefaults(params);
  },
  getDefaults: () => router().getUrlDefaults(),
  route: (name, params = {}) => router().url(name, params),
};