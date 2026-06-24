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