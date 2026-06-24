import { Response } from '@tyravel/http';
import type { Groupable } from '@tyravel/http';
import type { DebugCorrelationStore } from './correlation-store.js';
import type { DebugStore } from './store.js';

export function registerDebugRoutes(
  routes: Groupable,
  store: DebugStore,
  options: { path?: string; correlationStore?: DebugCorrelationStore } = {},
): void {
  const path = (options.path ?? '/__debug').replace(/\/$/, '');

  routes.get(path, () => Response.json({ entries: store.all() }));
  routes.get(`${path}/:id`, (request) => {
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