import { Route } from '@pondoknusa/core';

// Never imported from index
export function registerOrphanRoutes(): void {
  Route.get('/orphan', () => 'orphan');
}
