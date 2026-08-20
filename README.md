<p align="center">
  <a href="https://pondoknusa.dev"><img src="logo.svg" alt="Pondoknusa" width="96" height="96" /></a>
</p>

<h1 align="center">Pondoknusa</h1>

<p align="center">
  <strong>v4.1.1</strong> — TypeScript-native full-stack web framework (service container, routing, middleware, Eloquent ORM, queues, auth, post-quantum crypto, AI inference & RAG, native WebSockets, and a first-class CLI) on standard Web APIs.
</p>

<p align="center">
  <a href="https://github.com/pondoknusa/pondoknusa">GitHub</a> ·
  <a href="https://www.npmjs.com/org/pondoknusa">npm</a> ·
  <a href="https://pondoknusa.dev">Docs</a> ·
  <a href="https://pondoknusa.dev/guide/introduction">Guide</a> ·
  <a href="https://pondoknusa.dev/reference/generated/packages">Package Reference</a>
</p>

<p align="center">
  Requires <strong>Node.js ≥ 26</strong> (native SQLite <code>node:sqlite</code>, WebSocket server/client framing, and OpenSSL post-quantum crypto with no JavaScript fallbacks). Bun is also supported as a runtime.
</p>

---

## Highlights

- **Lean by default** — Zero third-party dependencies required out of the box. Default scaffold uses **SQLite** (`node:sqlite`), **database queues**, **log mail**, and **native WebSockets** with zero external daemons.
- **AI-Native & MCP** — Built-in LLM inference (`@pondoknusa/inference`) supporting **26+ providers** over standard `fetch` with zero SDK dependencies, vector embeddings & search (`@pondoknusa/vector`), RAG pipelines (`@pondoknusa/rag`), and Model Context Protocol agent server (`@pondoknusa/mcp`).
- **Post-Quantum Cryptography** — Native ML-KEM, ML-DSA, SLH-DSA, and hybrid X25519 + ML-KEM-768 encryption via Node 26+ OpenSSL (`@pondoknusa/crypto`), with encrypted sessions and quantum-safe OAuth tokens.
- **Cold-Start Optimized (v4.0)** — Bundled module config caching (`storage/framework/config.mjs`), `pondoknusa build --full` single-file serverless bundles, lazy middleware compilation, and instant pool warming.
- **Full-Stack Ergonomics** — Laravel-inspired elegance in pure TypeScript: IoC container, Eloquent ORM with relationships & migrations, Blade-style `.tyr` views with islands & streaming SSR, typed jobs, domain events, and fluent collections.
- **Enterprise Auth** — Session guard, hashed API tokens, multi-provider social OAuth (PKCE), OAuth2 authorization server (`@pondoknusa/auth-oauth`), WebAuthn / Passkeys (`@pondoknusa/auth-passkey`), and role/policy gates.

---

## Lean by default

A vanilla `pondoknusa new` app is almost entirely `@pondoknusa/*` packages. The default scaffold uses **SQLite** (no extra driver), **database queues**, and **log mail** — no Redis, no cloud SDKs, no external socket servers.

When you need external infrastructure, install only the specific driver package:

| Purpose | Optional driver package | Peer dependency | Third-party npm dependency |
|---------|-------------------------|-----------------|---------------------------|
| **PostgreSQL** | `@pondoknusa/database-pg` | `@pondoknusa/database` | `pg` |
| **MySQL** | `@pondoknusa/database-mysql` | `@pondoknusa/database` | `mysql2` |
| **Cloudflare D1** | `@pondoknusa/database-d1` | `@pondoknusa/database` | — *(REST API or Workers binding)* |
| **SQL Server** | `@pondoknusa/database-mssql` | `@pondoknusa/database` | `tedious` |
| **Oracle DB** | `@pondoknusa/database-oracle` | `@pondoknusa/database` | `oracledb` |
| **Redis** *(cache/queue/broadcast)* | `@pondoknusa/redis-node` | `@pondoknusa/redis` | `redis` |
| **Memcached** | `@pondoknusa/cache-memcached` | `@pondoknusa/cache` | `memcached` |
| **Upstash Redis** | `@pondoknusa/cache-upstash` | `@pondoknusa/cache` | `@upstash/redis` |
| **DynamoDB Cache** | `@pondoknusa/cache-dynamodb` | `@pondoknusa/cache` | `@aws-sdk/client-dynamodb` |
| **AWS S3 Storage** | `@pondoknusa/storage-aws-s3` | `@pondoknusa/storage` | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |
| **Cloudflare R2 Storage** | `@pondoknusa/storage-r2` | `@pondoknusa/storage` | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |
| **Supabase Storage** | `@pondoknusa/storage-supabase` | `@pondoknusa/storage` | `@supabase/storage-js` |
| **OpenAI SDK Inference** | `@pondoknusa/inference-openai` | `@pondoknusa/inference` | `openai` |
| **Anthropic SDK Inference** | `@pondoknusa/inference-anthropic` | `@pondoknusa/inference` | `@anthropic-ai/sdk` |
| **pgvector Vector Store** | `@pondoknusa/vector-pg` | `@pondoknusa/vector` | `pg`, `pgvector` |
| **Pinecone Vector Store** | `@pondoknusa/vector-pinecone` | `@pondoknusa/vector` | `@pinecone-database/pinecone` |
| **Qdrant Vector Store** | `@pondoknusa/vector-qdrant` | `@pondoknusa/vector` | `@qdrant/js-client-rest` |

Broadcasting uses a **native WebSocket** hub (`@pondoknusa/broadcasting-websocket`) and browser `WebSocket` via `@pondoknusa/echo` — zero third-party client dependencies. AI inference in `@pondoknusa/inference` supports 26+ vendors natively over standard `fetch` without vendor SDKs.

---

## API stability

Published `@pondoknusa/*` packages follow the semver and deprecation rules in [STABILITY.md](STABILITY.md). All 58 packages share a synchronized version number and release together.

- **[Upgrading to 4.0](docs/guide/upgrading-to-4.0.md)** — Cold-start bundled module config cache, `pondoknusa build --full`, view cache enforcement, lazy middleware compilation.
- **[Upgrading to 3.0](docs/guide/upgrading-to-3.0.md)** — Security hardening release (mass assignment protection, session integrity, OAuth/PKCE lockdown).
- **[Upgrading to 2.0](docs/guide/upgrading-to-2.0.md)** — Rebrand from Tyravel to Pondoknusa (`@tyravel/*` → `@pondoknusa/*`).
- **[Upgrading to 1.0](docs/guide/upgrading-to-1.0.md)** — Initial semver-strict release and async API sweep.

---

## Packages directory

The Pondoknusa monorepo is structured into focused, modular packages:

### Core & Architecture
| Package | Description |
|---------|-------------|
| [`@pondoknusa/core`](packages/core) | Application kernel, HTTP kernel, service providers, exception handlers, and facades (`Route`, `DB`, `Auth`, `Cache`, `Queue`, `Events`, `Log`, `Mail`, `Notifications`, `Storage`, `View`, `Gate`, `Password`) |
| [`@pondoknusa/container`](packages/container) | High-performance IoC service container with singletons, contextual bindings, aliases, and callable auto-injection |
| [`@pondoknusa/config`](packages/config) | Typed configuration loading, `.env` management, dotted-key `ConfigRepository`, and schema validation |
| [`@pondoknusa/support`](packages/support) | String helpers (`Str.slug`, `camel`, `snake`, `studly`, `kebab`, `random`), `Arr`, date helpers, and utilities |
| [`@pondoknusa/collection`](packages/collection) | Fluent, chainable, immutable collection pipeline (`collect()`, `where*`, `map`, `groupBy`, `sortBy`, `chunk`, `pipe`) |
| [`@pondoknusa/events`](packages/events) | Typed domain events, listeners, queued listeners (`QueuedListener`), and event subscribers (`EventSubscriber`) |
| [`@pondoknusa/locale`](packages/locale) | Localization, translation dictionaries, pluralization, and string interpolation |
| [`@pondoknusa/log`](packages/log) | Structured logging channels (single, daily, stack, console, json), correlation IDs, and `Log` facade |

### HTTP, Routing & API
| Package | Description |
|---------|-------------|
| [`@pondoknusa/http`](packages/http) | Expressive router, group prefixes/middleware, request/response helpers, JSON fast-path, signed URLs, and `JsonResource` API transformations |
| [`@pondoknusa/validation`](packages/validation) | Request validation engine with pipe rules (`required|email|min:5`), custom rules, and 422 Unprocessable Entity formatting |
| [`@pondoknusa/graphql`](packages/graphql) | Zero-dependency GraphQL server with programmatic schema definitions, query execution, and operation caching |
| [`@pondoknusa/lint`](packages/lint) | Static and request-level linter for Pondoknusa applications (route diagnostics, auth policies, CSRF exemptions) |
| [`@pondoknusa/debug`](packages/debug) | Request timeline profiler, database query inspector, debug bar UI, and CLI timeline watcher |
| [`@pondoknusa/admin`](packages/admin) | Instant auto-generated CRUD admin panel for Eloquent models |

### Database & ORM
| Package | Description |
|---------|-------------|
| [`@pondoknusa/database`](packages/database) | Eloquent ORM, fluent query builder, schema builder, migrations, model relations, scopes, casts, factories, seeders, soft deletes, prunable models, and pagination |
| [`@pondoknusa/database-pg`](packages/database-pg) | PostgreSQL driver with connection pooling and prepared statements |
| [`@pondoknusa/database-mysql`](packages/database-mysql) | MySQL / MariaDB driver (`mysql2`) |
| [`@pondoknusa/database-d1`](packages/database-d1) | Cloudflare D1 driver with read-after-write consistency handling |
| [`@pondoknusa/database-mssql`](packages/database-mssql) | Microsoft SQL Server driver (`tedious`) |
| [`@pondoknusa/database-oracle`](packages/database-oracle) | Oracle Database driver (`oracledb`) |

### Auth & Security
| Package | Description |
|---------|-------------|
| [`@pondoknusa/auth`](packages/auth) | Session guards, hashed API tokens (`tyr_*`), CSRF protection, Gate / policy authorization, password reset workflows, and social OAuth with PKCE |
| [`@pondoknusa/auth-oauth`](packages/auth-oauth) | Complete OAuth2 authorization server (authorization code + PKCE, client credentials, refresh tokens) |
| [`@pondoknusa/auth-passkey`](packages/auth-passkey) | WebAuthn / Passkeys authentication (ES256, zero external dependencies, browser mount + server verification) |
| [`@pondoknusa/crypto`](packages/crypto) | Post-quantum cryptography (ML-KEM, ML-DSA, SLH-DSA, hybrid X25519+ML-KEM-768), encrypted database sessions, and signed tokens |

### Queues, Cache, Storage & Comms
| Package | Description |
|---------|-------------|
| [`@pondoknusa/queue`](packages/queue) | Asynchronous job dispatching, database & redis queue drivers, retry logic, failed jobs management, and background worker daemon |
| [`@pondoknusa/cache`](packages/cache) | Unified cache repository with taggable stores (`Cache.tags()`), stampede protection (`remember()`), file/array/redis drivers |
| [`@pondoknusa/cache-dynamodb`](packages/cache-dynamodb) | AWS DynamoDB cache store driver |
| [`@pondoknusa/cache-memcached`](packages/cache-memcached) | Memcached store driver |
| [`@pondoknusa/cache-upstash`](packages/cache-upstash) | Upstash serverless Redis REST cache driver |
| [`@pondoknusa/redis`](packages/redis) | Redis connection manager and connection pooling |
| [`@pondoknusa/redis-node`](packages/redis-node) | `node-redis` client adapter |
| [`@pondoknusa/mail`](packages/mail) | Mail manager, mailable classes (`Mailable`), queued emails, log/array transports, and SMTP driver |
| [`@pondoknusa/notifications`](packages/notifications) | Multi-channel notifications (mail, database, Slack, SMS, webhooks), queued notifications, notification digest/batching |
| [`@pondoknusa/storage`](packages/storage) | Filesystem abstraction with public/private disks, streaming uploads, URL generation, and local disk driver |
| [`@pondoknusa/storage-aws-s3`](packages/storage-aws-s3) | AWS S3 storage driver with presigned URLs |
| [`@pondoknusa/storage-r2`](packages/storage-r2) | Cloudflare R2 storage driver |
| [`@pondoknusa/storage-supabase`](packages/storage-supabase) | Supabase Storage adapter |

### Real-Time & Views
| Package | Description |
|---------|-------------|
| [`@pondoknusa/views`](packages/views) | Blade-like `.tyr` template engine with layout inheritance, partials, components, `@memo` caching, compile-time folding, and worker preloading |
| [`@pondoknusa/ssr`](packages/ssr) | Client-side hydration runtime for `@island` components with streaming SSR shell flushing |
| [`@pondoknusa/reusable-components`](packages/reusable-components) | Prebuilt, accessible `.tyr` UI components (buttons, modals, forms, dropdowns) |
| [`@pondoknusa/broadcasting`](packages/broadcasting) | Event broadcasting contracts, private/presence channel authorization, and Echo integration |
| [`@pondoknusa/broadcasting-websocket`](packages/broadcasting-websocket) | Built-in zero-dependency WebSocket server hub and Redis broadcast fan-out |
| [`@pondoknusa/echo`](packages/echo) | Lightweight browser client for real-time channels using native WebSockets |

### AI, Vector, RAG & Agents
| Package | Description |
|---------|-------------|
| [`@pondoknusa/inference`](packages/inference) | Provider-agnostic LLM interface (chat, streaming, embeddings) with 26+ built-in presets over standard `fetch` without vendor SDKs |
| [`@pondoknusa/inference-openai`](packages/inference-openai) | OpenAI official SDK inference adapter |
| [`@pondoknusa/inference-anthropic`](packages/inference-anthropic) | Anthropic official SDK inference adapter |
| [`@pondoknusa/vector`](packages/vector) | Embedding storage, vector collections, and similarity search contracts |
| [`@pondoknusa/vector-pg`](packages/vector-pg) | PostgreSQL `pgvector` vector store driver |
| [`@pondoknusa/vector-pinecone`](packages/vector-pinecone) | Pinecone serverless vector database driver |
| [`@pondoknusa/vector-qdrant`](packages/vector-qdrant) | Qdrant vector database driver |
| [`@pondoknusa/rag`](packages/rag) | RAG document chunking, metadata extraction, vector ingestion pipelines, and retrieval helpers |
| [`@pondoknusa/mcp`](packages/mcp) | Model Context Protocol (MCP) server, capability manifest, and `pondoknusa.primer` for coding agents |

### CLI, Testing, REPL & Integrations
| Package | Description |
|---------|-------------|
| [`create-pondoknusa`](packages/create-pondoknusa) | Interactive project initializer (`npm create pondoknusa@latest`) |
| [`@pondoknusa/cli`](packages/cli) | First-class CLI (`pondoknusa`) for development, code scaffolding, database migrations, queue workers, and production bundling |
| [`@pondoknusa/repl`](packages/repl) | Interactive terminal shell (`pondoknusa shell`) with pre-wired models, facades, and history |
| [`@pondoknusa/testing`](packages/testing) | Feature test suite on Vitest, `TestCase`, `HttpTestClient`, container fakes (`mailFake`, `notificationFake`, `broadcastFake`), and time travel |
| [`@pondoknusa/telegram`](packages/telegram) | Telegram Bot API integration, webhooks, long-polling, and notification channel |
| [`@pondoknusa/telegram-2fa`](packages/telegram-2fa) | Two-factor authentication via Telegram bot verification |

---

## Quick start

### 1. Create a new project

```bash
npm create pondoknusa@latest my-app
```

The scaffolding experience is **create-and-breathe**:
- Generates a secure `APP_KEY` in `.env`
- Prepares `storage/` directory structure
- Installs dependencies
- Wires authentication, sessions, and SQLite database
- Runs initial database migrations
- Installs Cursor / Claude MCP rules and `AGENTS.md`
- Initializes a git repository

```bash
cd my-app
pondoknusa dev
```

Visit `http://127.0.0.1:3000`.

### Scaffolding flags

```bash
npm create pondoknusa@latest my-api -- --headless      # Headless JSON API without view layer
npm create pondoknusa@latest my-ai-app -- --ai         # AI-ready app with inference & vector routes
npm create pondoknusa@latest my-app -- --no-auth       # Skip auth scaffolding
npm create pondoknusa@latest my-app -- --no-git        # Skip git init
npm create pondoknusa@latest my-app -- --no-mcp        # Skip MCP agent configuration
```

### Monorepo example apps

The repository includes runnable examples in `examples/`:

- **[`examples/hello-world`](examples/hello-world)** — Complete full-stack web application with auth, views, queues, and deploy configurations.
- **[`examples/headless-api`](examples/headless-api)** — Pure REST API with token authentication, database queues, and OpenAPI generation.
- **[`examples/rag`](examples/rag)** — Document ingestion, vector embedding, similarity search, and SSE streaming RAG responses.

```bash
cd examples/hello-world
npm install
pondoknusa serve
```

---

## CLI reference

```bash
# Project & Server
pondoknusa new <name> [--path=<dir>]    # Create-and-breathe scaffold (+ MCP)
pondoknusa key:generate [--force]       # Generate or rotate APP_KEY in .env
pondoknusa dev                          # Start dev server with hot reload
pondoknusa serve [--port=3000] [--host] # Serve application in production mode
pondoknusa start [--cluster]            # Start multi-worker production cluster
pondoknusa build [--full] [--minify]    # Build production bundle (full inlines app + config)
pondoknusa shell                        # Interactive REPL with auto-imported facades and models
pondoknusa doctor [--perf] [--url=<url>]# Diagnostic health check (env, storage, db, redis, routes)
pondoknusa deploy:check                 # Pre-deployment validation checklist
pondoknusa app:lint                     # Static and runtime application audit
pondoknusa test [--perf]                # Run Vitest test suite with performance budgets
pondoknusa version                      # Output framework and CLI version

# Code Generators (Scaffolding)
pondoknusa make:controller <Name>       # Create src/controllers/<Name>Controller.ts (--api)
pondoknusa make:request <Name>          # Create src/requests/<Name>Request.ts
pondoknusa make:resource <Name>         # Create src/resources/<Name>Resource.ts
pondoknusa make:model <Name>            # Create src/models/<Name>.ts
pondoknusa make:migration <name>        # Create database/migrations/<timestamp>_<name>.ts
pondoknusa make:factory <Model>         # Create database/factories/<model>-factory.ts
pondoknusa make:seeder <Name>           # Create database/seeders/<name>-seeder.ts
pondoknusa make:provider <Name>         # Create src/providers/<Name>ServiceProvider.ts
pondoknusa make:middleware <Name>       # Create src/middleware/<name>.ts
pondoknusa make:command <Name>          # Create src/commands/<name>-command.ts
pondoknusa make:job <Name>              # Create src/jobs/<Name>.ts
pondoknusa make:event <Name>            # Create src/events/<Name>.ts
pondoknusa make:listener <Name>         # Create src/listeners/<Name>.ts
pondoknusa make:subscriber <Name>       # Create src/subscribers/<Name>.ts
pondoknusa make:view <name>             # Create resources/views/<name>.tyr
pondoknusa make:component <name>        # Create resources/views/components/<name>.tyr
pondoknusa make:island <name>           # Scaffold island view + client mount entrypoint
pondoknusa make:social-driver <name>    # Scaffold custom OAuth2 social driver
pondoknusa make:test <Name>             # Create tests/feature/<name>.test.ts
pondoknusa make:openapi                 # Generate storage/api/openapi.json schema
pondoknusa make:tool <Name>             # Create agent MCP tool definition
pondoknusa make:rag-resource <Name>     # Create RAG ingestion and retrieval resource

# Database & Migrations
pondoknusa migrate                      # Run pending database migrations
pondoknusa db:seed [--class=Seeder]     # Execute database seeders
pondoknusa model:prune                  # Prune models marked with Prunable

# Queues & Scheduled Tasks
pondoknusa queue:table                  # Create migration for database jobs table
pondoknusa queue:failed-table           # Create migration for failed_jobs table
pondoknusa queue:work [--queue=default] # Run background queue worker daemon
pondoknusa queue:failed                 # List all failed queue jobs
pondoknusa queue:retry <id|all>         # Retry failed queue job(s)
pondoknusa schedule:run                 # Execute scheduled console tasks and cron jobs

# Caching & Optimization
pondoknusa config:cache                 # Bundle config/* into storage/framework/config.mjs
pondoknusa config:clear                 # Clear cached configuration bundle
pondoknusa route:list [--json]          # Display registered routes table
pondoknusa route:cache                  # Pre-compile and serialize routing table
pondoknusa route:clear                  # Clear compiled route cache
pondoknusa view:cache                   # Pre-compile all .tyr view templates
pondoknusa view:clear                   # Clear compiled view cache directory
pondoknusa view:lint [--strict]         # Validate view syntax and directives
pondoknusa view:types                   # Generate TypeScript types for view component props
pondoknusa view:catalog [--json]        # Inspect discovered templates and islands

# Auth, Security & Passkeys
pondoknusa auth:install                 # Scaffold session auth (User model, routes, migrations)
pondoknusa oauth:install                # Scaffold OAuth2 authorization server
pondoknusa oauth:client:create <name>   # Register a new OAuth2 client application
pondoknusa session:prune                # Prune expired session rows
pondoknusa crypto:install               # Scaffold config/crypto.ts
pondoknusa crypto:generate-keys         # Generate post-quantum keypairs (ML-KEM / ML-DSA)

# AI, Vector & MCP
pondoknusa vector:install               # Scaffold vector configuration and migrations
pondoknusa vector:embed                 # Batch-embed records into configured vector store
pondoknusa mcp:install [--force]        # Configure Cursor MCP, rules, and AGENTS.md
pondoknusa mcp:serve                    # Start stdio MCP server for AI coding agents
pondoknusa mcp:export-rules             # Export agent rule definitions

# Debug & Telemetry
pondoknusa debug:install                # Scaffold debug bar and authenticated /__debug routes
pondoknusa debug:watch [--once]         # Stream live request timeline events to console
pondoknusa debug:clear                  # Purge persisted debug entries

# Localization & Notifications
pondoknusa lang:publish                 # Publish default translation files to lang/
pondoknusa lang:missing                 # Detect untranslated localization keys
pondoknusa notification:failed          # List failed notification deliveries
pondoknusa notification:retry <id>      # Re-dispatch failed notifications
pondoknusa admin:install                # Scaffold auto-generated CRUD admin panel
```

---

## Application structure

```
my-app/
├── pondoknusa.json           # Application entry and serve configuration
├── package.json
├── .env                      # Environment variables
├── config/                   # Typed application configuration
│   ├── app.ts
│   ├── auth.ts
│   ├── database.ts
│   ├── queue.ts
│   ├── cache.ts
│   ├── inference.ts          # AI providers & presets
│   ├── crypto.ts             # Post-quantum keys & session encryption
│   └── views.ts
├── database/
│   ├── migrations/           # Fluent schema migrations
│   ├── seeders/              # Database seeders
│   └── factories/            # Model factories
├── resources/
│   └── views/                # Blade-style .tyr templates
│       ├── layouts/
│       └── components/
└── src/
    ├── main.ts               # Application entrypoint and provider registration
    ├── controllers/          # HTTP controllers
    ├── requests/             # Form validation requests
    ├── resources/            # JSON API resource transformers
    ├── models/               # Eloquent ORM models
    ├── jobs/                 # Queueable async jobs
    ├── events/               # Domain events
    ├── listeners/            # Event listeners (sync or queued)
    ├── providers/            # Service providers
    └── routes/
        ├── web.ts            # Web routes with session/CSRF
        └── api.ts            # API routes with bearer token / OAuth
```

---

## Framework features & code tour

### Routing & Controllers

Pondoknusa provides an expressive router with group prefixing, middleware aliases, named routes, route model binding, and signed URLs:

```typescript
import { Route } from '@pondoknusa/core';
import { Response } from '@pondoknusa/http';
import { UserController } from '../controllers/user-controller.js';
import { StoreUserRequest } from '../requests/store-user-request.js';

// Basic route
Route.get('/', (request) => Response.json({ message: 'Welcome to Pondoknusa', path: request.path }));

// Route groups with middleware and prefixes
Route.prefix('api/v1')
  .middleware('auth:api')
  .group(() => {
    Route.get('/users', [UserController, 'index']).name('users.index');
    Route.post('/users', [UserController, 'store', StoreUserRequest]).name('users.store');
    
    // Implicit Route Model Binding
    Route.get('/users/{user}', [UserController, 'show']).name('users.show');
  });

// Signed URL generation
const signedUrl = Route.signed('verify.email', { user: 1 }, { expiresIn: 3600 });
```

Controllers resolve through the IoC container, automatically injecting typed dependencies into constructors.

---

### Form requests & validation

Form requests encapsulate validation rules and authorization gates:

```typescript
import { FormRequest } from '@pondoknusa/core';
import { User } from '../models/user.js';

export class StoreUserRequest extends FormRequest<{ name: string; email: string; role: string }> {
  async authorize(): Promise<boolean> {
    return this.authorizePolicy('create', User);
  }

  rules() {
    return {
      name: ['required', 'string', 'min_length:2'],
      email: ['required', 'email', 'unique:users,email'],
      role: ['required', 'in:admin,editor,member'],
    };
  }
}
```

When validation fails, Pondoknusa automatically returns an HTTP 422 JSON response with structured error messages.

---

### API resources (`JsonResource`)

Transform models and paginated collections into consistent API payloads:

```typescript
import { JsonResource } from '@pondoknusa/http';
import type { PondoknusaRequest } from '@pondoknusa/http';
import { User } from '../models/user.js';

export class UserResource extends JsonResource<User> {
  toArray(_request?: PondoknusaRequest) {
    return {
      id: this.resource.getAttribute('id'),
      name: this.resource.getAttribute('name'),
      email: this.resource.getAttribute('email'),
      created_at: this.resource.getAttribute('created_at'),
    };
  }
}

// In controller:
return UserResource.make(user);                        // Wrapped in { data: ... }
return UserResource.collection(users);                 // Collection
return UserResource.collection(await User.paginate()); // Paginated collection with meta & links
```

---

### Eloquent-style ORM & Database

Typed models, active record pattern, relationships, query scopes, casts, and migrations:

```typescript
import { Model } from '@pondoknusa/database';
import type { ModelQueryBuilder } from '@pondoknusa/database';
import { Post } from './post.js';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  active: boolean;
  settings: Record<string, unknown>;
}

export class User extends Model<UserAttributes> {
  static override table = 'users';
  static override casts = {
    active: 'boolean',
    settings: 'json',
  };

  // Query Scope
  static scopeActive(builder: ModelQueryBuilder): ModelQueryBuilder {
    return builder.where('active', true);
  }

  // Relations
  posts() {
    return this.hasMany(Post, 'user_id');
  }
}

// Queries
const users = await User.scope('active').orderBy('created_at', 'desc').getModels();
const user = await User.find(1);
const posts = await user.posts().get();
const newPost = await user.posts().create({ title: 'Hello World', body: '...' });

// Pagination
const page = await User.query().paginate(15, 1);
```

#### Migrations

```typescript
import { Schema } from '@pondoknusa/database';

export async function up(schema: Schema): Promise<void> {
  await schema.create('users', (table) => {
    table.id();
    table.string('name');
    table.string('email').unique();
    table.boolean('active').default(true);
    table.json('settings').nullable();
    table.timestamps();
  });
}
```

---

### Fluent Collections (`@pondoknusa/collection`)

Performant, immutable, and type-safe data pipelines:

```typescript
import { collect } from '@pondoknusa/collection';

const staff = collect([
  { id: 1, name: 'Ada Lovelace', role: 'admin', points: 120 },
  { id: 2, name: 'Grace Hopper', role: 'editor', points: 95 },
  { id: 3, name: 'Alan Turing', role: 'admin', points: 150 },
]);

const adminTotal = staff
  .filter(u => u.role === 'admin')
  .sortByDesc('points')
  .sum('points'); // 270

const grouped = staff.groupBy('role');
// Collection: { admin: [...], editor: [...] }
```

---

### Blade-style views (`.tyr`), Components & SSR Streaming

Write clean server-rendered templates in `resources/views/`:

```html
@layout('layouts.app')

@section('title')
  Dashboard - {{ appName }}
@endsection

@section('content')
  <h1>Welcome back, {{ user.name }}</h1>

  @if (posts.length)
    <div class="grid">
      @foreach (posts as post)
        @component('components.post-card', { post })
      @endforeach
    </div>
  @else
    <p>No posts available.</p>
  @endif

  <!-- Island hydration for client-side interactivity -->
  @island('counter', { initialCount: 10 })
@endsection
```

- **Compile-time optimization**: Static `@if` and conditional branches are folded at build time.
- **Component `@memo`**: Caches component HTML output based on prop hashes.
- **Streaming SSR**: `Response.ssrStream()` flushes the document `<head>` and shell immediately before body chunks resolve.

---

### Queues, Scheduled Tasks & Domain Events

#### Typed Jobs & Queues

```typescript
import { Job } from '@pondoknusa/queue';
import { dispatch, Queue } from '@pondoknusa/core';

export class ProcessReportJob extends Job<{ reportId: number }> {
  override async handle(): Promise<void> {
    const { reportId } = this.data;
    // Execute expensive calculation
  }
}

// Dispatch immediately or delayed
await dispatch(new ProcessReportJob({ reportId: 42 }));
await Queue.later(60, new ProcessReportJob({ reportId: 42 }));
```

Run workers via `pondoknusa queue:work`.

#### Domain Events & Queued Listeners

```typescript
import { Event, Listener, QueuedListener } from '@pondoknusa/events';
import { Events } from '@pondoknusa/core';

export class OrderPlaced extends Event<{ orderId: number; amount: number }> {}

// Background queued listener
export class SendOrderConfirmation extends QueuedListener<OrderPlaced> {
  static override queue = 'emails';

  override async handle(event: OrderPlaced): Promise<void> {
    // Sends confirmation email asynchronously
  }
}

await Events.dispatch(new OrderPlaced({ orderId: 101, amount: 49.99 }));
```

---

### AI Inference, Vector Search & RAG

#### `@pondoknusa/inference` (26+ Provider Presets)

Call LLMs with a unified API using standard `fetch` without heavy SDKs:

```typescript
import { inferenceChat, streamInferenceChat, registerInferenceProvidersFromEnv } from '@pondoknusa/inference';

// Auto-registers all providers found in .env (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Ollama, etc.)
registerInferenceProvidersFromEnv();

// Simple chat completion
const response = await inferenceChat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Explain post-quantum cryptography briefly.' },
], { provider: 'deepseek', model: 'deepseek-chat' });

console.log(response.content);

// Streaming response
for await (const delta of streamInferenceChat(messages, { provider: 'openai' })) {
  process.stdout.write(delta);
}
```

#### Vector Search & RAG

```typescript
import { VectorStore } from '@pondoknusa/vector';
import { RagPipeline } from '@pondoknusa/rag';

// Search vector database
const matches = await VectorStore.connection('pgvector').search('embeddings_table', queryVector, {
  limit: 5,
  similarity: 'cosine',
});

// Grounded RAG prompt construction
const rag = new RagPipeline();
const groundedPrompt = await rag.buildContext(userQuestion, matches);
```

#### Model Context Protocol (MCP)

Pondoknusa includes native MCP integration for AI coding assistants:

```bash
pondoknusa mcp:serve           # Starts stdio MCP server exposing routes, models, and tools
pondoknusa mcp:export-rules    # Exports AGENTS.md / Cursor rules
```

---

### Authentication, OAuth2 & Post-Quantum Cryptography

#### Authentication & Authorization

```typescript
import { Auth, Gate, Password } from '@pondoknusa/core';

// Session login
await Auth.attempt({ email: 'ada@example.com', password: 'secret-password' });

// API tokens (hashed at rest with tyr_ prefix)
const token = await Auth.createToken('cli-token', ['read:reports'], { expiresIn: '30d' });

// Gate authorization
await Gate.authorize(Auth.user(), 'update', document);
```

#### OAuth2 Authorization Server (`@pondoknusa/auth-oauth`)

```bash
pondoknusa oauth:install
pondoknusa oauth:client:create "Mobile Client" --redirect=https://app.example.com/callback
```

Provides full support for Authorization Code (with mandatory PKCE), Client Credentials, and Refresh Token grants.

#### WebAuthn / Passkeys (`@pondoknusa/auth-passkey`)

Zero-dependency passkey registration and biometric authentication using standard WebAuthn APIs.

#### Post-Quantum Cryptography (`@pondoknusa/crypto`)

Native OpenSSL 3.5+ post-quantum algorithms on Node 26+:

- **ML-KEM (Kyber)** & **Hybrid X25519 + ML-KEM-768** key encapsulation
- **ML-DSA (Dilithium)** & **SLH-DSA (SPHINCS+)** quantum-safe digital signatures
- **Encrypted database sessions** and quantum-safe signed OAuth tokens

```bash
pondoknusa crypto:generate-keys --algorithm=hybrid-x25519-ml-kem-768
```

---

### Real-Time Broadcasting & Echo

Zero-dependency native WebSocket broadcasting:

```typescript
// Server: src/events/message-sent.ts
import { Event } from '@pondoknusa/events';

export class MessageSent extends Event<{ message: string; from: string }> {
  broadcastOn() {
    return ['chat-room'];
  }
}
```

```typescript
// Browser: Native WebSocket Echo client (zero third-party deps)
import { Echo } from '@pondoknusa/echo';

const echo = new Echo({
  broadcaster: 'websocket',
  wsHost: window.location.hostname,
  wsPort: 3000,
});

echo.channel('chat-room').listen('MessageSent', (event) => {
  console.log(`${event.from}: ${event.message}`);
});
```

---

### Cache, Mail, Notifications & Storage

```typescript
import { Cache, Mail, Notifications, Storage } from '@pondoknusa/core';
import { InvoicePaidNotification } from '../notifications/invoice-paid.js';
import { WelcomeMail } from '../mail/welcome-mail.js';

// Cache with stampede protection & tagging
const stats = await Cache.tags(['analytics']).remember('daily_summary', 3600, async () => {
  return computeAnalytics();
});

// Mail (log, array, SMTP)
await Mail.to('user@example.com').send(new WelcomeMail(user));

// Multi-channel Notifications (database, mail, Slack, SMS)
await Notifications.send(user, new InvoicePaidNotification(invoice));

// Cloud & local filesystem storage
await Storage.disk('s3').put('reports/annual.pdf', fileBuffer);
const url = await Storage.disk('s3').temporaryUrl('reports/annual.pdf', 300);
```

---

### Interactive REPL (`pondoknusa shell`) & Testing

#### Interactive Shell

```bash
pondoknusa shell
```

Drops into an interactive TypeScript REPL with all models, facades (`DB`, `Route`, `Auth`, `Cache`), and container bindings automatically imported.

#### Feature Testing with `@pondoknusa/testing`

```typescript
import { TestCase, withPondoknusaTest, mailFake } from '@pondoknusa/testing';

class UserTest extends TestCase {}
const t = withPondoknusaTest(UserTest);

it('creates a user and sends welcome mail', async () => {
  const mail = mailFake();

  const response = await t.http.post('/api/v1/users', {
    json: { name: 'Ada Lovelace', email: 'ada@example.com' },
  });

  await response.assertStatus(201).assertJsonPath('data.name', 'Ada Lovelace');
  mail.assertSent(WelcomeMail);
});
```

---

### Production deployment & bundling (v4.0)

Pondoknusa 4.0 is engineered for instant cold starts across container and serverless environments:

```bash
# Production optimization pipeline
npm install -D esbuild
pondoknusa route:cache
pondoknusa view:cache
pondoknusa build --full
```

`pondoknusa build --full` bundles your application code, framework kernel, and configuration into a single standalone module (`bootstrap/app.mjs`), eliminating disk I/O and cold-start overhead in AWS Lambda, Cloudflare Workers, Fly.io, Railway, and Docker.

```bash
NODE_ENV=production node bootstrap/app.mjs
```

---

## Contributing & Publishing

```bash
# Run tests across all 58 packages
npm test

# Type-check entire monorepo
npm run typecheck

# Prepare release (bump, tag, push)
npm run release:prepare -- patch
```

Package releases are published to the [`@pondoknusa` npm organization](https://www.npmjs.com/org/pondoknusa) via GitHub Actions OIDC Trusted Publishing.

---

## Documentation

Comprehensive documentation is available at [**pondoknusa.dev**](https://pondoknusa.dev):

- **[Guide](docs/guide/introduction.md)** — Architectural concepts, routing, ORM, auth, inference, and views.
- **[Configuration Reference](docs/guide/configuration-reference.md)** — Complete options for every `config/*.ts` file.
- **[Deployment Hub](docs/guide/deployment.md)** — Docker, Fly.io, Railway, Cloudflare, and CI/CD pipelines.
- **[Performance & Cold Starts](docs/guide/performance.md)** — Benchmarks, bundling, and optimization strategies.
- **[Security Policy](SECURITY.md)** — Vulnerability reporting and disclosure process.
- **[API Stability Policy](STABILITY.md)** — Semver and deprecation policy.

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for full progress and milestone details.

### Shipped Highlights (through v4.1)

- [x] **v1.0.0** — Semver strict declaration, hosted documentation at [pondoknusa.dev](https://pondoknusa.dev), complete facade reference, deploy walkthroughs.
- [x] **v2.0.0** — Rebrand to Pondoknusa (`@pondoknusa/*`), unified npm scope and CLI branding.
- [x] **v3.0.0** — Security hardening: mass assignment protection, session integrity, OAuth/PKCE lockdown, body limits.
- [x] **v4.0.0** — Cold-start bundling: bundled module config caching (`storage/framework/config.mjs`), `pondoknusa build --full` single-file serverless builds, lazy middleware dispatch, warm connection pools.
- [x] **v4.1.0+** — LLM inference provider registry (`@pondoknusa/inference`) with 26+ zero-SDK presets, create-and-breathe scaffolding, Cursor MCP primer and agent rule generation.

---

## License

[MIT](LICENSE) © Pondoknusa Contributors

