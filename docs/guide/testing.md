# Testing

Use `@tyravel/testing` with Vitest:

```typescript
import { describe, it } from 'vitest';
import { TestCase } from '@tyravel/testing';

class FeatureTest extends TestCase {
  protected override async setUp() {
    await super.setUp();
    // register providers, run migrations, etc.
  }
}

describe('users', () => {
  it('lists users', async () => {
    const test = new FeatureTest();
    await test.setUp();

    const response = await test.get('/api/users');
    response.assertStatus(200).assertJson({ ok: true });

    await test.tearDown();
  });
});
```

## HTTP test client

- `get`, `post`, `put`, `patch`, `delete` — run through `HttpKernel`
- `withToken('...')` — attach Bearer token
- Cookie jar persists session cookies between requests

## Assertions

```typescript
response.assertStatus(200);
response.assertJson({ name: 'Ada' });       // partial match
response.assertJsonPath('data.0.id', 1);
```

## Container fakes

```typescript
import { fake, mockInstance } from '@tyravel/testing';

fake('mail', { send: async () => {} });
```

Wire facades to the test application with `wireFacades(app)` so `Route`, `Auth`, and `Gate` resolve correctly in tests.

## Queued listeners and jobs

When tests use `QUEUE_CONNECTION=database`, queued listeners and mailables persist jobs until a worker processes them. After dispatching HTTP requests that trigger queued work, drain the queue before asserting side effects:

```typescript
// See examples/hello-world/tests/support/reference-test-case.ts
await test.drainQueue();
```

Use `MAIL_MAILER=array` (or fakes) together with queue draining to assert outbound mail in feature tests.

## SSR and hydration assertions

When testing pages that use `@island`, capture the hydration manifest alongside the HTML:

```typescript
const view = await renderView(app, 'welcome', { name: 'Ada' });

view.assertSee('Hello Ada');
view.assertIsland('counter');
view.assertHydrationManifest({
  islands: [{ id: 'counter', html: expect.stringContaining('button'), props: { count: 0 } }],
});
```

HTTP feature tests can assert the injected manifest on the full document:

```typescript
const response = await test.get('/');
response.assertStatus(200);
response.assertSee('data-tyr-island="counter"');
response.assertSee('id="tyr-hydration"');
```

## Pest-style ergonomics

Import Vitest helpers and Tyravel lifecycle sugar from one module:

```typescript
import { describe, expect, test, uses } from '@tyravel/testing/pest';

class FeatureTest extends TestCase {
  protected createApplication() {
    return new Application('/tmp/app');
  }
}

const t = uses(FeatureTest);

describe('posts', () => {
  test('lists posts', async () => {
    await t.http.get('/posts').assertOk();
  });
});
```

`uses()` is an alias for `withTyravelTest()`. `dataset()` formats rows for `test.each()`:

```typescript
import { dataset, test } from '@tyravel/testing/pest';

test.each(dataset([
  { slug: 'draft', status: 201 },
  { slug: 'published', status: 200 },
]))('creates $slug', async ({ slug, status }) => {
  // ...
});
```

## Parallel test runner (Vitest workspaces)

Large Tyravel apps benefit from Vitest workspaces so unit, feature, and package suites run in parallel without sharing one giant config.

**Monorepo root** — keep package tests isolated per project:

```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*',
  'examples/*/vitest.config.ts',
]);
```

**Application** — split fast unit tests from HTTP feature tests:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit',
    include: ['tests/unit/**/*.test.ts'],
    pool: 'forks',
    fileParallelism: true,
  },
});
```

```typescript
// vitest.feature.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'feature',
    include: ['tests/feature/**/*.test.ts'],
    pool: 'forks',
    fileParallelism: false, // one app boot at a time per worker
    maxWorkers: 2,
  },
});
```

Register both in the workspace:

```typescript
export default defineWorkspace([
  './vitest.config.ts',
  './vitest.feature.config.ts',
]);
```

Guidelines for Tyravel feature tests:

- Prefer `uses(FeatureTest)` / `withTyravelTest()` so each example gets a fresh `Application`.
- Enable `usesDatabaseTransactions` on `TestCase` when tests touch SQLite/Postgres — avoids cross-test pollution when files run in parallel.
- Keep `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync` (or fakes) in the test `.env` so parallel workers do not contend on shared mail/queue state.
- Run `npm test -- --project feature` to execute only the feature project in CI.