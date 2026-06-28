# 1. Install & first route

Create a Tyravel app, boot the HTTP kernel, and return your first HTML page.

## Create the project

```bash
npx tyravel new blog
cd blog
npm install
```

The default scaffold uses SQLite, a database queue, and log mail — no Redis or cloud SDKs required.

## Project layout

Key files:

- `src/main.ts` — boots providers and the HTTP kernel
- `src/routes/web.ts` — web routes (or `routes/web.ts` depending on scaffold)
- `config/` — typed configuration modules
- `resources/views/` — `.tyr` templates

See [Application structure](/guide/application-structure) for the full map.

## First route

```typescript
import { Route, View } from '@tyravel/core';
import { Response } from '@tyravel/http';

Route.get('/', async () =>
  Response.html(await View.render('welcome', { title: 'Hello Tyravel' })),
);

Route.get('/health', async () => Response.json({ ok: true }));
```

Create the view:

```bash
tyravel make:view welcome
```

## Run the dev server

```bash
tyravel serve
```

Visit `http://127.0.0.1:3000` and `/health`.

### Verified in CI

The [`examples/hello-world`](https://github.com/thesimonharms/tyravel/tree/main/examples/hello-world) reference app exercises this step. Its feature test asserts the welcome page contains `Hello Tyravel`:

```bash
cd examples/hello-world && npm test
```

## Named routes

```typescript
Route.get('/posts', async () => Response.json([])).name('posts.index');
```

List routes with `tyravel route:list` — filters and JSON output are documented in the [routing guide](/guide/routing).

## Next

Continue to [Auth & database](/tutorials/02-auth-and-database) to persist users and protect routes.