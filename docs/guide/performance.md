# Performance

Tyravel ships snappy defaults for production: route caches, JSON fast paths, request pooling, compiled view LRU, and pool warm-up. This guide is the boot checklist and tuning reference for Tier 19 speed work.

## Production boot checklist

Run these once per deploy (or in your CI image build):

```bash
tyravel config:cache
tyravel route:cache
tyravel view:cache
```

Then boot with production env:

```bash
NODE_ENV=production APP_DEBUG=false tyravel start
```

In your app entrypoint, call `prepareHttpServer()` after `app.boot()` so route and middleware caches are validated before accepting traffic.

### What warms automatically

| Feature | Config / env | Default in production |
|---------|----------------|----------------------|
| Route cache | `storage/framework/routes.json` | Built by `route:cache` |
| Config cache | `storage/framework/config.json` | Built by `config:cache` |
| View compiled cache | `view:cache` + `preloadCompiled: true` | On in `config/views.ts` scaffold |
| DB pool warm-up | `DB_POOL_WARMUP=true` | On when `NODE_ENV=production` |
| Request pooling | `http.requestPooling` | On when `APP_DEBUG=false` |
| JSON fast path | `http.jsonFastPath` | On |
| Early 404 | `http.early404` | On when `APP_DEBUG=false` |

## Headless API mode

For JSON-only backends, use `tyravel new --headless`. Headless scaffolds skip views, SSR, and Echo — smaller boot profile and faster cold start. See [Headless API](/guide/headless).

## HTTP hot path

- **JSON fast path** — stateless API routes skip session, CSRF, and view middleware. Tag routes with `withMiddlewareMeta(..., { tag: 'session' })` only when you need sessions.
- **Request pooling** — reuses `TyravelRequest` instances under load. Enable with `requestPooling: true` in `config/http.ts` (default off in debug, on in production scaffolds).
- **Keep-alive** — Node adapter sets `keepAliveTimeout` / `headersTimeout` for reverse-proxy deployments.

## Views & SSR

- **`view:cache`** — compile all `.tyr` templates to disk; production rejects cache misses when `compiled: true`.
- **Runtime LRU** — compiled templates are cached in memory after first read.
- **Streaming shell flush** — `Response.ssrStream()` and `View.streamSsr()` emit the document `<head>` (including CSS links) before the first view chunk. Pass `head` with your Vite or asset tags for fastest first paint.
- **Empty hydration skip** — pages without `@island` markers omit the hydration JSON script entirely.

```typescript
Route.get('/dashboard', () =>
  View.streamSsr('dashboard', context, handlers, {
    head: '<link rel="stylesheet" href="/build/app.css">',
  }),
);
```

For Turbo/HTMX partial updates without full reloads, see the [partial reload cookbook](/cookbook/partial-reload).

## Database & pools

### SQLite (file-backed)

Production scaffolds enable **WAL journal mode** by default (`journalMode: 'wal'` in `config/database.ts`). WAL allows concurrent readers while a writer is active — important for SQLite on Fly/Railway with multiple workers.

### Postgres / MySQL pool sizing

Start with **one pool per worker process**, not one global pool for the whole machine:

| Deployment | Suggested `DB_POOL_MAX` per worker | Notes |
|------------|-----------------------------------|-------|
| Fly.io (1 shared CPU) | 5–10 | Match `tyravel start` worker count |
| Railway (512 MB) | 5 | Watch connection limits on hobby Postgres |
| Single VPS (2 workers) | 10 per worker | Total ≤ provider max connections |

Environment variables (driver packages):

- `DB_POOL_WARMUP` — fire `SELECT 1` on boot (default `true` in production scaffold)
- `DB_POOL_MAX` — max connections per pool
- `DB_POOL_IDLE_TIMEOUT` — idle connection eviction in ms

Enable pool warm-up so the first real query does not pay connection setup latency.

## Caching

Scaffold `config/cache.ts` defaults to the `file` driver. In production with Redis available:

```bash
CACHE_STORE=redis
```

Wrap expensive reads:

```typescript
const posts = await Cache.remember('home:posts', 300, async () => {
  return Post.query().orderBy('published_at', 'desc').limit(10).getModels();
});
```

For safe public GET routes, add HTTP cache middleware (`ETag` / `304`) from Tier 15. See [Cache](/guide/cache).

## When to use Redis

| Use Redis when… | Skip Redis when… |
|-----------------|------------------|
| Multiple app workers share sessions | Single-process dev |
| Queue driver is `redis` | Database queue is enough |
| Cache hit rate matters at scale | File cache is fine for low traffic |
| WebSocket broadcast fan-out | Log driver suffices |

## Anti-patterns

- **N+1 queries** — use `with()` / eager loading; enable `Model.preventLazyLoading()` in development.
- **Uncached views in production** — always run `view:cache` before deploy; set `compiled: true`.
- **Session on every API route** — use JSON fast path; scope session middleware to browser routes only.
- **Synchronous boot work** — defer admin, debug, and MCP providers (lazy registration) until first use.
- **Full page reload for small UI updates** — use `View.partial()` / `Response.partial()` instead.

## Measuring

```bash
npm run benchmark
BENCHMARK_QUICK=1 npm run benchmark -- --json
```

See [Benchmarks](/guide/benchmarks) for CI snapshots, regression gates, and Bun vs Node notes.

## Related

- [Deployment](/guide/deployment) — workers, horizontal scaling
- [Headless API](/guide/headless) — backend-only scaffold
- [Views & templating](/guide/views) — streaming SSR and islands
- [Observability cookbook](/cookbook/observability) — production latency signals