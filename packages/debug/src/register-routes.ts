import { Response } from '@pondoknusa/http';
import type { Groupable } from '@pondoknusa/http';
import type { DebugCorrelationStore } from './correlation-store.js';
import type { DebugStore } from './store.js';

export function registerDebugRoutes(
  routes: Groupable,
  store: DebugStore,
  options: {
    path?: string;
    correlationStore?: DebugCorrelationStore;
    requireAuth?: boolean;
  } = {},
): void {
  const path = (options.path ?? '/__debug').replace(/\/$/, '');

  const guard = options.requireAuth
    ? (request: { user: unknown }) => {
        if (!request.user) {
          return Response.json({ message: 'Unauthorized.' }, { status: 401 });
        }
        return null;
      }
    : () => null;

  routes.get(path, (request) => {
    const denied = guard(request);
    if (denied) {
      return denied;
    }

    const correlation = request.query('correlation');
    if (correlation) {
      const entry = store.get(correlation);
      if (!entry) {
        return Response.json({ message: 'Debug entry not found.' }, { status: 404 });
      }

      const executions = options.correlationStore?.getForRequest(correlation) ?? [];
      return Response.json(executions.length > 0 ? { ...entry, executions } : entry);
    }

    return Response.json({ entries: store.all() });
  });
  routes.get(`${path}/:id`, (request) => {
    const denied = guard(request);
    if (denied) {
      return denied;
    }

    const entry = store.get(request.param('id') ?? '');
    if (!entry) {
      return Response.json({ message: 'Debug entry not found.' }, { status: 404 });
    }

    const executions = options.correlationStore?.getForRequest(entry.id) ?? [];
    if (executions.length === 0) {
      return Response.json(entry);
    }

    return Response.json({ ...entry, executions });
  });
}
