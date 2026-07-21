# Upgrading to 3.0

Pondoknusa **3.0.0** is a **security-focused major release**. It hardens auth, HTTP, database, debug, OAuth, and passkey flows. Several defaults that were permissive in **2.x** are now strict — plan a test pass after bumping dependencies.

See the [v3.0.0 release notes](https://github.com/pondoknusa/pondoknusa/releases/tag/v3.0.0) and [changelog](https://github.com/pondoknusa/pondoknusa/blob/main/CHANGELOG.md).

## Before you upgrade

1. Pin to the latest **2.x** patch and run your test suite.
2. Search for the breaking areas listed below — especially models that pass request bodies straight into `create()` / `update()`, API tokens without explicit abilities, and OAuth clients without PKCE.
3. Bump every `@pondoknusa/*` dependency to `^3.0.0` (monorepo packages release together).

```diff
# package.json
- "@pondoknusa/core": "^2.3.1"
+ "@pondoknusa/core": "^3.0.0"
```

## Model mass assignment

`Model.create()` and `Model.update()` now filter attributes through **`fillable`**, **`guarded`**, and **`hidden`** — matching Laravel-style mass-assignment rules.

| Property | Default in 3.0 | Effect |
|----------|----------------|--------|
| `fillable` | `[]` | When non-empty, only listed columns are written |
| `guarded` | `['id']` | When `fillable` is empty, listed columns are blocked |
| `hidden` | `[]` | Stripped from `toJSON()` / serialization |

### What breaks

Code that relied on passing an entire request body into `User.create(body)` without declaring assignable columns will silently drop fields (or block `id` updates).

### Migration

Declare assignable columns on each model:

```typescript
export class Post extends Model {
  static table = 'posts';
  static fillable = ['title', 'body', 'user_id'];
  static hidden = ['internal_notes'];
}
```

For admin-only fields, keep them out of `fillable` and set them explicitly:

```typescript
const post = await Post.create({ title, body, user_id });
post.update({ published_at: new Date() }); // only if `published_at` is fillable
```

`__proto__`, `constructor`, and `prototype` keys are always rejected.

## API token abilities

`parseTokenAbilities()` (used when loading personal access tokens) now returns **`[]`** when the stored value is missing, malformed, or not a JSON string array. In **2.x**, invalid data defaulted to **`['*']`** (full access).

### What breaks

Tokens with corrupt `abilities` JSON or empty abilities no longer grant wildcard access. `tokenCanAny()` already returned `false` for empty abilities; the change closes the parse fallback gap.

### Migration

- Re-issue tokens that should have explicit scopes.
- Audit token rows: `abilities` must be valid JSON such as `["posts:read","posts:write"]`.
- Use `['*']` only when you intentionally want unrestricted tokens.

## Sessions and cookies

### Session ID regeneration on login

Successful `SessionGuard.login()` now **destroys the old session ID** and issues a new one with the same payload. This closes session-fixation issues.

### Session integrity (HMAC)

Serialized session payloads can be sealed with `SessionIntegrity` when `APP_KEY` (or a dedicated integrity key) is at least **16 characters**. Tampered payloads are rejected.

**Existing sessions** stored before upgrade may use the legacy plain JSON format; `SessionIntegrity.open()` still accepts unsigned payloads for one release cycle, but new writes are sealed. Users may need to sign in again after deploy if you rotate `APP_KEY`.

### Secure cookies in production

Session cookies default to **`Secure`** when `NODE_ENV=production` unless `session.secure` is explicitly set to `false`.

### Migration

- Ensure `APP_KEY` is at least 16 characters in every environment.
- Behind TLS terminators, confirm `session.secure` matches your deployment (leave default `true` in production).
- Expect all users to get new session cookies on first request after deploy.

## Social OAuth state

Social login now **binds and consumes** the `state` parameter in the session (`bindOAuthState` / `consumeOAuthState`). Callbacks with missing or mismatched `state` throw `Invalid OAuth state.`

### Migration

Use the framework helpers when starting and finishing OAuth redirects — do not skip `state` generation or validation on custom drivers.

## OAuth2 server (PKCE)

**Public clients** (no `client_secret`) **must** send `code_challenge` / `code_challenge_method` on the authorization request. Confidential clients may still omit PKCE.

### Migration

Update SPA and mobile OAuth clients to use PKCE (`S256`). Register `code_verifier` when exchanging the authorization code.

## Passkeys

WebAuthn registration now accepts only **`none`** attestation. `packed` and other formats are rejected with `attestation_unsupported`.

### Migration

Set `attestation: 'none'` in passkey config (this is already the default). Users who registered with `packed` attestation must re-register passkeys after upgrade.

## Debug toolkit

- Debug routes and the in-memory debug store are **disabled when `NODE_ENV=production`**, regardless of `APP_DEBUG`.
- Debug HTTP routes require **authentication** (`requireAuth: true`).

### Migration

Do not rely on `/__debug/*` (or your configured prefix) in production. Use structured logging (`@pondoknusa/log`) and your APM for production observability.

## Cryptography keys

At-rest key derivation (`@pondoknusa/crypto`) and `SESSION_ENCRYPTION_KEY` now require sources of at least **16 characters** (16 decoded bytes for base64 keys). Shorter keys throw at boot.

### Migration

Generate a new `APP_KEY` / `SESSION_ENCRYPTION_KEY` if your local `.env` still uses short placeholders from early scaffolds.

## HTTP and middleware

### Request body size limit

The Node HTTP adapter enforces a default **10 MB** body limit (`PONDOKNUSA_MAX_BODY_BYTES`). Oversized bodies are rejected before route handlers run.

### CSRF middleware label

`AuthServiceProvider` registers CSRF as a named middleware **`csrf`** and applies it globally (with default exceptions for `/api/*`, `/broadcasting/auth`, `/webhooks/*`). Routes should use `Route.middleware(['csrf', …])` — not inline anonymous CSRF functions — so the JSON fast path recognizes CSRF-protected routes.

### JSON fast path

POST routes that include `csrf`, `auth`, or `guest` middleware no longer take the JSON fast path that skipped session/CSRF work. Stateful JSON endpoints behave like normal middleware stacks.

### Signed URLs

HMAC signing now covers the full query string in canonical order. URLs generated with **2.x** that appended extra query parameters after signing may fail verification in **3.0**. Regenerate signed links with `URL.signed()` / `URL.temporarySigned()`.

### Trusted proxies

Client IP resolution prefers the socket `remoteAddress` and only trusts `X-Forwarded-For` / `X-Real-IP` when proxy trust is configured. Rate limits and audit logs may show different IPs if you previously relied on spoofable headers without proxy config.

## WebSocket and broadcasting

Connection counts, subscription limits, and per-frame size caps are enforced server-side. High-volume clients may need to batch messages or raise limits in broadcasting config.

## Checklist

- [ ] All `@pondoknusa/*` packages bumped to `^3.0.0`
- [ ] Models declare `fillable` / `guarded` / `hidden` where `create()` / `update()` accept user input
- [ ] Personal access tokens store valid JSON ability arrays; no reliance on parse fallback to `['*']`
- [ ] `APP_KEY` and encryption keys are ≥ 16 characters
- [ ] OAuth public clients use PKCE; social OAuth uses state binding
- [ ] Passkey registration uses `none` attestation only
- [ ] Debug tooling not depended on in production
- [ ] CSRF applied via the `csrf` middleware alias on state-changing routes
- [ ] Signed URLs regenerated if you appended query params manually
- [ ] Tests pass on **3.0.x**

## Earlier majors

- Still on **Tyravel** (`@tyravel/*`)? Complete [Upgrading to 2.0](/guide/upgrading-to-2.0) first.
- On **0.11–0.16**? Follow [Upgrading to 1.0](/guide/upgrading-to-1.0) before the 2.0 rename.

**3.0.0** shipped in July 2026. Stable APIs only break in major releases per [STABILITY.md](https://github.com/pondoknusa/pondoknusa/blob/main/STABILITY.md).
