# 2. Auth & database

Add users, run migrations, and protect routes with session authentication.

## Install auth scaffolding

```bash
tyravel auth:install
```

This wires session guards, user model stubs, login routes, and CSRF middleware. See [Authentication](/guide/auth) for token guards and social OAuth.

## Migration

```bash
tyravel make:migration create_users_table
tyravel migrate
```

Define columns in the generated migration using the blueprint API documented in [Database & ORM](/guide/database).

## Protect a route

```typescript
import { Route, Auth } from '@tyravel/core';
import { Response } from '@tyravel/http';

Route.get('/dashboard', async () => {
  const user = await Auth.user();
  if (!user) {
    return Response.redirect('/login');
  }
  return Response.json({ email: user.email });
});
```

Prefer policies and middleware for production apps — covered in the [controllers guide](/guide/controllers).

## Seed data

```bash
tyravel make:seeder UserSeeder
tyravel db:seed
```

### Verified in CI

`examples/hello-world/tests/feature/reference.test.ts` registers a user, drains the queue, and asserts the welcome mailable was sent. Login/logout session flow is covered in the same file.

## Next

[Queues & events](/tutorials/03-queues-and-events) — dispatch a welcome notification in the background.