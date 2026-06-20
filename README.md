# Tyravel

A TypeScript-native web framework with the ergonomics of Laravel — service container, expressive routing, middleware, and an Artisan-style CLI — built on standard Web APIs.

## Packages

| Package | Description |
|---------|-------------|
| `@tyravel/container` | IoC container with bindings, singletons, aliases, and callable injection |
| `@tyravel/http` | Router, route groups, middleware registry, request/response helpers |
| `@tyravel/config` | Typed config loading and dotted-key `ConfigRepository` |
| `@tyravel/validation` | Request validation with pipe rules and 422 error responses |
| `@tyravel/database` | Eloquent-style models, query builder, schema, and migrations |
| `@tyravel/views` | Blade-like `.tyr` templates with layouts, sections, and components |
| `@tyravel/queue` | Typed jobs, sync/database drivers, dispatch facade, and queue worker |
| `@tyravel/core` | Application kernel, controllers, service providers, HTTP kernel, `Route` facade |
| `@tyravel/cli` | Project scaffolding, dev server, and code generators |

## Quick start

From the repository root:

```bash
npm install
npm run build
```

Create a new application:

```bash
npx tyravel new my-app
cd my-app
npm install
tyravel serve
```

Visit `http://127.0.0.1:3000`.

### Example app

The `examples/hello-world` app is also runnable from the monorepo:

```bash
cd examples/hello-world
npm install
tyravel serve
```

## CLI

```bash
tyravel list                         # List available commands
tyravel new <name> [--path=<dir>]    # Scaffold a new application
tyravel serve [--port=3000] [--host=127.0.0.1]
tyravel make:controller <Name>       # Create src/controllers/<Name>Controller.ts
tyravel make:provider <Name>           # Create src/providers/<Name>ServiceProvider.ts
tyravel make:model <Name>              # Create src/models/<Name>.ts
tyravel make:migration <name>            # Create database/migrations/<timestamp>_<name>.ts
tyravel make:view <name>                 # Create resources/views/<name>.tyr
tyravel make:job <Name>                  # Create src/jobs/<Name>.ts
tyravel queue:table                      # Migration for the jobs table
tyravel queue:work [--queue=default]     # Process database queue jobs
tyravel migrate                        # Run pending migrations
tyravel version                      # Show CLI version
```

New projects include a `tyravel.json` config file:

```json
{
  "name": "my-app",
  "entry": "src/main.ts",
  "serve": {
    "port": 3000,
    "hostname": "127.0.0.1"
  }
}
```

`tyravel serve` reads this config and passes `TYRAVEL_PORT` / `TYRAVEL_HOST` to the app. Bun is the recommended runtime; Node 22+ is also supported natively via the built-in HTTP adapter.

## Application structure

```
my-app/
├── tyravel.json
├── package.json
├── config/
│   └── app.ts
└── src/
    ├── main.ts
    ├── routes/
    │   └── web.ts
    ├── providers/
    │   └── app-service-provider.ts
    └── controllers/
```

### Routes

```typescript
import { Route } from '@tyravel/core';
import { Response } from '@tyravel/http';
import { UserController } from '../controllers/user-controller.js';

Route.get('/', (request) =>
  Response.json({ message: 'Welcome to Tyravel', path: request.path }),
);

Route.prefix('api')
  .middleware('auth')
  .group(() => {
    Route.get('/users', [UserController, 'index']);
    Route.get('/users/:id', [UserController, 'show']).name('users.show');
  });
```

### Controllers

```typescript
Route.get('/users', [UserController, 'index']);
```

Controller classes are resolved through the service container, so constructor dependencies are injected automatically when bound.

### Middleware aliases

```typescript
app.middleware('auth', async (request, next) => {
  if (!request.bearerToken()) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return next();
});

Route.middleware('auth').get('/profile', handler);
```

### Config

```typescript
// config/app.ts
export default {
  name: 'Tyravel',
  debug: true,
} as const;

// src/main.ts
app.register(ConfigServiceProvider);
const name = app.make<ConfigRepository>('config').get<string>('app.name');
```

### Validation

```typescript
import { validateRequest } from '@tyravel/validation';

const data = await validateRequest(request, {
  email: 'required|email',
  age: 'required|integer|min:18',
});
```

Invalid requests return HTTP 422 with a structured `errors` object.

### Database / ORM

```typescript
import { Model } from '@tyravel/database';
import type { ModelQueryBuilder } from '@tyravel/database';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
}

export class User extends Model<UserAttributes> {
  static override table = 'users';

  static scopeActive(builder: ModelQueryBuilder): ModelQueryBuilder {
    return builder.where('active', 1);
  }
}

const users = await User.all();
const active = await User.scope('active').getModels();
const user = await User.find(1);
const created = await User.create({ name: 'Ada', email: 'ada@example.com' });
await user.update({ name: 'Grace' });
await user.delete();

// Relationships
const posts = await user.hasMany(Post).get();
const post = await user.hasOne(Post).get();
const author = await post.belongsTo(User).get();
const roles = await user.belongsToMany(Role).get();
```

Register `DatabaseServiceProvider`, add `config/database.ts`, then run migrations:

```bash
tyravel migrate
```

`config/database.ts` supports SQLite, PostgreSQL, and MySQL:

```typescript
export default {
  default: 'sqlite',
  connections: {
    sqlite: { driver: 'sqlite', database: 'database/database.sqlite' },
    postgres: {
      driver: 'postgres',
      host: '127.0.0.1',
      database: 'tyravel',
      username: 'postgres',
      password: '',
    },
    mysql: {
      driver: 'mysql',
      host: '127.0.0.1',
      database: 'tyravel',
      username: 'root',
      password: '',
    },
  },
} as const;
```

Migrations live in `database/migrations/` and use a fluent schema builder:

```typescript
await schema.create('users', (table) => {
  table.id();
  table.string('email');
  table.timestamps();
});
```

**Drivers:** SQLite (Node 22.5+ via `node:sqlite`), PostgreSQL (`pg`), and MySQL (`mysql2`).

**Query scopes:** define `scopeName(builder, ...args)` on a model and call `Model.scope('name', ...args)`. Global scopes use `Model.addGlobalScope((builder) => ...)`.

### Views / Templating

Register `ViewServiceProvider`, add `config/views.ts`, and place templates in `resources/views/`:

```typescript
import { View, ViewServiceProvider, setViewApplication } from '@tyravel/core';
import { Response } from '@tyravel/http';

setViewApplication(app);
app.register(ViewServiceProvider);

Route.get('/', async () =>
  Response.html(await View.render('welcome', { name: 'Ada' })),
);
```

`.tyr` templates support Blade-like directives:

```html
@layout('layouts.app')

@section('title')
  Dashboard
@endsection

@section('content')
  <h1>Hello {{ name }}</h1>
  @if (users.length)
    @foreach (users as user)
      <p>{{ user.name }}</p>
    @endforeach
  @endif
  @component('components.alert', { message: 'Welcome' })
@endsection
```

Layouts use `@yield('section')`. Values in `{{ }}` are HTML-escaped; use `{!! html !!}` for raw output. Generate views with `tyravel make:view pages.about`.

### Queue / Jobs

Register `QueueServiceProvider`, add `config/queue.ts`, and register job classes on the `JobRegistry` in `AppServiceProvider`:

```typescript
import { JobRegistry } from '@tyravel/queue';
import { SendWelcomeEmail } from '../jobs/send-welcome-email.js';

this.app.make<JobRegistry>('jobs.registry').register(SendWelcomeEmail);
```

Dispatch from routes or services:

```typescript
import { dispatch, Queue } from '@tyravel/core';
import { SendWelcomeEmail } from '../jobs/send-welcome-email.js';

await dispatch(new SendWelcomeEmail({ email: 'ada@example.com' }));

await Queue.connection('database').dispatch(
  new SendWelcomeEmail({ email: 'grace@example.com' }),
  'emails',
);

await Queue.later(60, new SendWelcomeEmail({ email: 'later@example.com' }));
```

Typed job classes:

```typescript
import { Job } from '@tyravel/queue';

export interface SendWelcomeEmailPayload {
  email: string;
}

export class SendWelcomeEmail extends Job<SendWelcomeEmailPayload> {
  override async handle(): Promise<void> {
    // send mail using this.data.email
  }
}
```

For the database driver, create the jobs table and run a worker:

```bash
tyravel queue:table
tyravel migrate
tyravel queue:work --connection=database --queue=default
```

`config/queue.ts` supports `sync` (immediate, great for local dev) and `database` (persistent, worker-driven):

```typescript
export default {
  default: 'sync',
  connections: {
    sync: { driver: 'sync' },
    database: {
      driver: 'database',
      table: 'jobs',
      connection: 'sqlite',
      retryAfter: 90,
    },
  },
} as const;
```

### Service providers

```typescript
import { ServiceProvider } from '@tyravel/core';

export class AppServiceProvider extends ServiceProvider {
  override register() {
    this.app.instance('app.name', 'Tyravel');
  }
}
```

## Development

```bash
npm test          # Run all package tests
npm run build     # Build all packages
npm run typecheck # Type-check via project references
```

## Roadmap

### Now (v0.1)

- [x] Service container (`bind`, `singleton`, `alias`, `call`)
- [x] HTTP router with middleware and named routes
- [x] Application kernel and service provider lifecycle
- [x] `Route` facade
- [x] CLI: `new`, `serve`, `make:controller`, `make:provider`

### Next (v0.2) — done

- [x] **Route groups** — `Route.prefix('api').middleware('auth').group(...)`
- [x] **Controller resolution** — route-to-controller binding with container injection
- [x] **Config system** — typed `config/*.ts` loaded by a `ConfigServiceProvider`
- [x] **Middleware registry** — named middleware aliases (`auth`, `guest`, etc.)
- [x] **Node HTTP adapter** — first-class `serve()` without requiring Bun
- [x] **Validation** — request validation with typed rules and error responses

### Later

- [x] **Eloquent-style ORM** — typed models, query builder, and migrations
- [x] **Blade-like templating** — TS-native view layer with layouts and components
- [x] **Queue and jobs** — background job dispatch with typed payloads
- [ ] **Event bus** — typed domain events and listeners
- [ ] **Auth** — sessions, guards, and policies
- [ ] **Testing utilities** — `TestCase`, HTTP test client, container fakes
- [ ] **Package ecosystem** — publishable first-party packages (cache, mail, notifications)

## License

MIT