# Upgrading to 4.0

Pondoknusa **4.0.0** is a **cold-start-focused major release**. It reworks how config, routes, and views are cached so serverless and edge deploys boot from a single bundled module instead of hundreds of small files. Most apps only need to rebuild their caches — but the cache formats and a few runtime behaviors changed, so plan a deploy-pipeline update and a test pass.

See the [v4.0.0 release notes](https://github.com/pondoknusa/pondoknusa/releases/tag/v4.0.0) and [changelog](https://github.com/pondoknusa/pondoknusa/blob/main/CHANGELOG.md).

## Before you upgrade

1. Pin to the latest **3.x** patch and run your test suite.
2. Bump every `@pondoknusa/*` dependency to `^4.0.0` (monorepo packages release together).
3. Add `esbuild` as a dev dependency if you use `pondoknusa config:cache` or `pondoknusa build` — it is now required by both.

```diff
# package.json
- "@pondoknusa/core": "^3.4.0"
+ "@pondoknusa/core": "^4.0.0"
+ "esbuild": "^0.27.0"
```

## Config cache is now a bundled module

`pondoknusa config:cache` no longer writes a JSON manifest containing your merged config. JSON could not represent class values (Eloquent models in `auth.providers`, event listener classes in `events.listeners`, policy maps) and silently serialized them to `null` — which broke auth and events in production.

In **4.0**, `config:cache` bundles `config/*` into a single ESM module at `storage/framework/config.mjs` (esbuild, `keepNames` on). Class references survive the round-trip, and boot imports **one file** instead of re-importing every config module and its transitive app imports.

### What breaks

- **Old caches are ignored.** A v1 `storage/framework/config.json` from 3.x is rejected and the app falls back to live config loading until you re-run `pondoknusa config:cache`.
- **`esbuild` is required** for `config:cache` (previously dependency-free).
- **`ConfigCacheManifest` type changed** (if you import it from `@pondoknusa/config`): `config: ConfigTree` was removed and replaced by `bundle: string`; `version` is now `2`.
- **Env values resolve at boot, not at cache time.** The bundled config module re-evaluates `env()` when the app boots (`.env` is loaded first). This is more 12-factor-correct, but if you relied on baking env values into the cache artifact, that no longer happens.

### Migration

```bash
npm install -D esbuild
pondoknusa config:clear   # remove the v1 manifest
pondoknusa config:cache   # writes storage/framework/config.mjs + v2 manifest
```

::: warning Rebuild the cache on every deploy
`config.mjs` inlines app code your config imports (models, listeners, policies), but the staleness fingerprints only track `config/*` and `.env`. **Run `config:cache` as part of every build**, not just when config files change — or use `pondoknusa build --full`, which sidesteps this entirely.
:::

## New: `pondoknusa build --full`

The recommended serverless build now produces one file containing the framework, your app, **and** the merged config:

```bash
pondoknusa route:cache && pondoknusa view:cache
pondoknusa build --full
node bootstrap/app.mjs
```

- `@pondoknusa/*` packages and app code are inlined; third-party npm packages (`pg`, native addons like `oracledb`) stay external in `node_modules`.
- Config is baked in via a build-time registration hook (`registerCachedConfig` in `@pondoknusa/config`), so there is exactly one copy of every class — no singleton hazards.
- Because config is embedded, **re-run the build after changing `config/*`**; fingerprint checks don't apply to embedded config.
- Route and view caches are still read from `storage/framework` at boot — keep `route:cache` / `view:cache` in your pipeline.

The plain `pondoknusa build` (packages external + `config:cache`) continues to work unchanged.

### Migration

Swap your production start script from `tsx` to the bundle, e.g.:

```diff
# package.json
- "start": "PONDOKNUSA_HOST=0.0.0.0 tsx src/main.ts"
+ "build": "pondoknusa route:cache && pondoknusa view:cache && pondoknusa build --full",
+ "start": "PONDOKNUSA_HOST=0.0.0.0 node bootstrap/app.mjs"
```

## Views: production defaults are now enforced

A partial `config/views.ts` (e.g. only `path` and `extension`) is now **merged over the framework defaults** instead of replacing them. Previously such a config silently disabled production view optimizations: compiled-view caching, `requireCompiledCache`, and boot-time preloading.

Separately, boot-time `preloadCompiledCache()` no longer **recompiles every template** (it used to spawn the worker pool on every cold start); it now reads the compiled artifacts that `view:cache` wrote.

### What breaks

Apps with a partial `config/views.ts` that deploy **without running `view:cache`** will now throw `CompiledViewCacheMissError` on first render in production — previously boot compiled views for you as a side effect.

### Migration

1. Add `pondoknusa view:cache` to your build step (this was always recommended; it is now load-bearing).
2. Or opt out explicitly in `config/views.ts` if you really want runtime compilation: `{ compiled: false, requireCompiledCache: false, preloadCompiled: false }`.

## Router: middleware resolves at dispatch, not registration

Route middleware aliases (`csrf`, `auth`, `guest`, `throttle:*`) are now resolved **lazily at first route-table compile** instead of when the route is registered. Routes can reference aliases registered by providers that boot later, and tooling (`route:cache`, `route:list`) no longer needs the full provider stack — the 3.x `MiddlewareNotFoundException: Middleware not found: csrf` crash in those commands is fixed.

### What breaks

- `RouteDefinition.middleware` (the resolved function array) is **empty until first dispatch/compile**; the raw inputs live on the new `middlewareInputs` field. Code inspecting `route.middleware` right after registration should read `middlewareLabels` (alias strings) instead.
- Unknown-alias errors now surface at first request (or route-cache warm) rather than at route registration.

### Migration

If you validate middleware eagerly in tests, call `router.warmRouteCache()` first — it compiles the table and resolves all aliases.

## Database pool warm-up

Boot-time pool warm-up now dials only the **default connection** instead of every configured connection. Optional/unused connections (e.g. a postgres block while `DB_CONNECTION=sqlite`) no longer produce connection errors at boot or stall cold starts.

### Migration

If you depend on secondary connections being hot at boot, warm them explicitly after boot: `await db.warmPools(['reports'])`. The `DatabaseManager.warmPools()` API is unchanged.

## Smaller changes

- **`build --minify` keeps class names** (`keepNames: true`). Minified 3.x bundles could crash the event registry (`Cannot read properties of null (reading 'name')`) because `constructor.name` is load-bearing. Bundles are slightly larger; no action needed.
- **`config:cache` / `loadConfig` import config modules concurrently.** Duplicate keys (`app.ts` + `app.js`) still resolve last-file-wins, in directory order.
- **New diagnostics:** run with `PONDOKNUSA_BOOT_PROFILE=1` to log per-provider boot timings — handy for your own cold-start budgets.

## Recommended 4.0 deploy pipeline

```bash
npm ci
npm install -D esbuild          # once
pondoknusa route:cache
pondoknusa view:cache
pondoknusa build --full         # or: config:cache + build
NODE_ENV=production node bootstrap/app.mjs
```

## Checklist

- [ ] All `@pondoknusa/*` packages bumped to `^4.0.0`
- [ ] `esbuild` installed as a dev dependency
- [ ] Old `storage/framework/config.json` removed; `config:cache` re-run (v2 bundle)
- [ ] `config:cache` (or `build --full`) runs on **every** build, not only when config changes
- [ ] `view:cache` is in the deploy pipeline if you have a custom `config/views.ts`
- [ ] No code reads `RouteDefinition.middleware` before first dispatch
- [ ] Production start script runs `node bootstrap/app.mjs` (no `tsx`)
- [ ] Tests pass on **4.0.x**

## Earlier majors

- On **2.x**? Complete [Upgrading to 3.0](/guide/upgrading-to-3.0) first — it ships mandatory security changes.
- Still on **Tyravel** (`@tyravel/*`)? Follow [Upgrading to 2.0](/guide/upgrading-to-2.0) before the 3.0/4.0 steps.

**4.0.0** shipped in July 2026. Stable APIs only break in major releases per [STABILITY.md](https://github.com/pondoknusa/pondoknusa/blob/main/STABILITY.md).
