# Tyravel Roadmap

Post-v0.1.0 direction. v0.1 shipped the core Laravel-shaped stack; subsequent releases focus on polish, production adapters, and real-world ergonomics.

## Tier 1 — Credibility (v0.2.0)

Make the framework trustworthy for early adopters.

- [x] **Reference app** — Upgrade `examples/hello-world` (or add `examples/blog`) with `auth:install`, a queued job, a mailable, and a feature test
- [x] **`.env` support** — `loadEnv()`, `env()` helper, `.env.example`, config stubs wired to environment variables
- [x] **Exception handler polish** — `ExceptionHandler` with debug HTML pages, consistent JSON API errors, `HttpException` base class, 405 Method Not Allowed
- [x] **CI + release script** — GitHub Actions CI (typecheck/build/test on push+PR), automated npm publish on tag, `npm run release:prepare` version bumper

## Tier 2 — Daily-driver quality (v0.2.x)

Close gaps developers hit on day two of a real project.

- [x] **ORM eager loading** — `with()` to avoid N+1 queries on relationships
- [x] **Seeders + factories** — Dev data and test ergonomics (`tyravel make:factory`, `db:seed`)
- [x] **Redis queue + cache drivers** — First production-grade external adapter
- [x] **Driver-aware migrations** — Postgres/MySQL schema parity beyond SQLite-centric blueprints

## Tier 3 — Adoption (v0.3+)

Grow the ecosystem and Laravel parity for API-heavy apps.

- [x] **Form requests** — Validation + authorization on controller actions
- [x] **API resources / transformers** — Structured JSON serialization
- [x] **Documentation site** — Tutorials beyond the monorepo README
- [x] **More auth adapters** — Redis/database session drivers, additional OAuth providers

## Tier 4 — Framework depth (v0.4.0)

TypeScript-native depth for any full-stack app — not domain-specific features. Laravel-shaped ergonomics without PHP ceremony; batteries included, magic by default.

### Data layer

- [x] **DB transactions** — `transaction()` helper with async-native, typed usage
- [x] **Model casts** — typed attribute serialization (`datetime`, `json`, `boolean`, …)
- [x] **Soft deletes** — `deleted_at`, `withTrashed()`, `restore()`, `forceDelete()`
- [x] **Model lifecycle hooks** — `creating`, `created`, `updating`, `updated`, `deleting`, `deleted`

### Operations

- [x] **Logging** — structured `Log` facade with typed context (stdout, file, stack drivers)
- [x] **Scheduler** — task registration API and `tyravel schedule:run` for cron
- [x] **Health checks** — connectivity probes for database, Redis, and app readiness
- [x] **Session maintenance** — `tyravel session:prune` for database session driver

### HTTP & deployment

- [x] **CORS middleware** — config-driven cross-origin support for APIs
- [x] **Rate limiting** — throttle middleware with configurable limits
- [x] **Trusted proxies** — correct client IP and scheme behind load balancers

### Files

- [x] **Storage** — filesystem abstraction with local driver
- [x] **S3 storage driver** — cloud-compatible object storage adapter

### CLI & DX

- [x] **`tyravel route:list`** — named routes, methods, middleware, and handlers
- [x] **`tyravel make:middleware`** — scaffold custom middleware
- [x] **`tyravel make:command`** — scaffold console commands

## Tier 5 — Magic DX (v0.5.0)

Recreate the magic of Laravel in a way that feels TypeScript native, with developer and execution speed. No docs work — everything here is in-code DX.

### P0 — Must ship

- [x] **Collection** — `@tyravel/collection` fluent, type-safe chainable collection with 50+ methods, lazy evaluation, and a `collect()` helper. The single most iconic Laravel DX moment, made TypeScript-native.
- [x] **`tyravel shell`** — Interactive TypeScript REPL that boots the full application. All facades pre-imported (`Route`, `DB`, `Auth`, `Cache`, …), app models auto-loaded, top-level `await` support. Drop into a prompt and play.
- [x] **Global helpers** — `now()`, `today()`, `collect()`, `throw_if()`, `throw_unless()`, `optional()`, `with()`, `transform()`, `retry()`, `report()`, `dd()`, `dump()`, `base_path()`, `app_path()`, and more — all in `@tyravel/support`.

### P1 — Strong want

- [x] **Stringable** — `Stringable.of('hello')->slug()->title()->toString()`. Fluent string chaining.
- [x] **Pipeline** — `Pipeline.send(input).through([...pipes]).then(result => ...)`. Clean data-through-pipes for middleware stacks, form requests, and data transformations.
- [x] **Macroable** — `Request.macro('jsonApi', fn(...) => ...)`. Extend core classes (`Request`, `Response`, `Collection`, `QueryBuilder`) at runtime.
- [x] **Conditionable** — `.when(condition, q => q.where(...))` on `QueryBuilder`, `Collection`, `Pipeline`.

### P2 — If scope allows

- [x] **Auto-discovery** — Convention-based scanning of `app/providers/` and `app/commands/`. Drop a provider or command file in the right directory, it's auto-registered.
- [x] **Interactive `tyravel new`** — Prompt for database driver, auth guard, queue driver, mail driver, redis. Progress bar (`npm install`) in interactive mode. Builds on the existing `tyravel new` which already handled DB + redis prompts.
- [x] **Command bus** — `Bus.dispatch(new SendWelcomeEmail(user))`. Auto-resolve handlers from the container, explicit mapping via `Bus.map()`, self-handling commands supported.

## Tier X — Production-ready project

Open-ended tier: done when Tyravel is a framework teams can adopt with confidence in production — not tied to a version number. Items land here when the core framework depth (Tier 4+) is in place.

- [ ] **Hosted documentation** — public docs site (beyond in-repo VitePress)
- [ ] **tyravel-mcp** — agent-oriented capability index so models can build Tyravel apps without searching the whole codebase
- [ ] **Ecosystem guide** — how to publish and maintain third-party `@tyravel/*` packages
- [ ] **Graceful shutdown** — drain in-flight requests and queue workers on SIGTERM
- [ ] **Config validation** — fail fast at boot when required environment variables are missing
- [ ] **API stability policy** — documented semver guarantees for public package surfaces

## Shipped in v0.1.0

- Service container, HTTP router, kernel, facades, CLI scaffolding
- Route groups, controllers, config, middleware, validation, Node `serve()`
- Eloquent-style ORM, views, queue/events
- Auth (session, tokens, OAuth, policies, password reset)
- `@tyravel/testing`, cache, mail (SMTP + queued), notifications (queued)