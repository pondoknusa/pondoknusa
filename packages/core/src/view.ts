import type { ViewContext } from '@tyravel/views';
import { ViewEngine } from '@tyravel/views';
import type { Application } from './application.js';

let activeApp: Application | undefined;

export function setViewApplication(app: Application): void {
  activeApp = app;
}

function viewEngine(): ViewEngine {
  if (!activeApp) {
    throw new Error(
      'View facade is not ready. Boot the application and register ViewServiceProvider first.',
    );
  }
  return activeApp.make<ViewEngine>('view');
}

export interface ViewFacade {
  render(name: string, context?: ViewContext): Promise<string>;
  exists(name: string): boolean;
}

export const View: ViewFacade = {
  render: (name, context) => viewEngine().render(name, context),
  exists: (name) => viewEngine().exists(name),
};