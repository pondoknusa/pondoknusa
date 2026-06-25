import { registerGraphQLRoutes } from './graphql.js';
import { registerWebRoutes } from './web.js';

export function registerRoutes(): void {
  registerWebRoutes();
  registerGraphQLRoutes();
}