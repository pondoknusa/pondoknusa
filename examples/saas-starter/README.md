# SaaS starter

Forkable Tyravel app scaffold for auth, dashboard routes, queues, and deploy manifests. The fastest path is to generate a fresh project:

```bash
npm create tyravel@latest my-saas -- --template=saas --auth
cd my-saas
tyravel migrate
tyravel auth:install
tyravel dev --queue
```

## What the `saas` template includes

- SSR welcome page with dashboard JSON route stub
- Auth dependency pre-installed (`tyravel auth:install` scaffolds guards and OAuth routes)
- Database queue connection and `dev:worker` script
- `deploy/` directory (Docker, Compose, Fly, Railway)
- `.github/workflows/view-types.yml` for prop drift checks
- `tyravel test` and `precommit` (`tyravel view:lint`) scripts

## Reference implementations

| Feature | See |
|---------|-----|
| Full auth + OAuth + policies | `examples/hello-world` |
| Admin UI | `tyravel admin:install` after auth |
| RAG / AI stack | `examples/rag` |
| Production deploy | `deploy/README.md` in any scaffold |

## Pre-deploy

```bash
tyravel doctor
tyravel deploy:check
tyravel view:cache
tyravel route:cache
```

Migrate from Laravel? See [Migrating from Laravel](https://tyravel.dev/guide/migrating-from-laravel).