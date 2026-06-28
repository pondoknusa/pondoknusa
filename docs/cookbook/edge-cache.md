# Edge response cache

Serve cacheable public GET responses from an edge network using Tyravel's **ETag middleware** (Tier 15) and your CDN or reverse proxy replay cache.

## App setup

Wrap safe, idempotent GET routes with HTTP cache middleware:

```typescript
import { createHttpCacheMiddleware } from '@tyravel/http';

Route.get('/posts/:slug', handler, {
  middleware: [
    createHttpCacheMiddleware({
      maxAge: 300,
      etag: async (_request, body) => hashBody(body),
    }),
  ],
});
```

Tyravel emits `ETag` and honors `If-None-Match` with `304 Not Modified` when content is unchanged.

## Cloudflare

1. Enable **Cache Rules** for `GET` paths that return `Cache-Control: public` or your middleware `max-age`.
2. Respect origin `ETag` — Cloudflare revalidates with `If-None-Match` on cache hits.
3. Bypass cache for authenticated/session routes (cookies, `Authorization`).

Example cache rule expression:

```
(http.request.method eq "GET" and starts_with(http.request.uri.path, "/posts/"))
```

Set **Edge TTL** from `Cache-Control` and enable **Origin Cache Control**.

## Fly.io

Use Fly's [http_service concurrency](https://fly.io/docs/reference/configuration/#the-http_service-section) with Tyravel behind `fly-proxy`. For replay-style caching:

- Terminate TLS at Fly; run Tyravel with `prepareHttpServer()` and route cache warm.
- Set `Cache-Control` on public JSON/HTML responses.
- Use `fly certs` + multiple machines; sticky sessions are **not** required for cacheable GET routes.

For dynamic HTML with sessions, keep cache off and rely on Tyravel view/response caches at the origin.

## Railway / nginx

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=tyravel:10m;

location /public/ {
  proxy_cache tyravel;
  proxy_cache_valid 200 5m;
  proxy_cache_revalidate on;
  proxy_pass http://127.0.0.1:3000;
}
```

Ensure Tyravel sends `ETag` so nginx can revalidate instead of serving stale content indefinitely.

## Checklist

| Route type | Edge cache? |
|------------|-------------|
| Public blog post HTML | Yes — short `max-age` + ETag |
| Authenticated dashboard | No |
| JSON API with personal data | No |
| Versioned static assets (`/build/*`) | Yes — long `max-age`, fingerprinted filenames |

## Related

- [Cache](/guide/cache) — `Cache.remember()` and Redis
- [Performance](/guide/performance) — production boot and pool sizing