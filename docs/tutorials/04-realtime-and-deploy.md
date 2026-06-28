# 4. Realtime & deploy

Broadcast domain events to the browser and prepare for production.

## WebSocket broadcasting

Since **v0.13.0**, Tyravel ships a native WebSocket hub (`@tyravel/broadcasting-websocket`) — no Socket.io or Pusher.

Follow the full [Broadcasting & realtime](/guide/broadcasting) guide for config, channel auth, Echo client setup, and nginx proxy notes.

Quick checklist:

1. Scaffold with Redis: `tyravel new my-app --redis`
2. Set `BROADCAST_CONNECTION=websocket` in `.env`
3. Register `WebSocketBroadcastServiceProvider` in `src/main.ts`
4. Define channels in `routes/channels.ts` (private channel prefixes ship in **v0.16** scaffolds)

`examples/hello-world` does not include broadcasting yet — use a `--redis` scaffold or the [realtime Echo recipe](/cookbook/realtime-echo) for a minimal client.

## Production checklist

| Task | Command / config |
|------|------------------|
| Route cache | `tyravel route:cache` |
| View compile cache | `tyravel view:cache` + `config/views.ts` `compiled: true` |
| Env validation | Per-file `schema` in `config/*.ts` |
| Queue worker | `tyravel queue:work` under a process supervisor |
| Graceful shutdown | `SIGTERM` handling is built into `serve()` |

## Deploy targets

Tyravel runs on any Node 26+ host (container, VM, bare metal). Standard Web APIs mean adapters stay thin — see `serve()` in `@tyravel/core`.

## Cookbook & reference

- [Realtime UI with Echo](/cookbook/realtime-echo) — recipe for channel auth + client bootstrap
- [CLI reference](/reference/generated/cli) — full command list
- [Upgrading to 1.0](/guide/upgrading-to-1.0) — pre-1.0 migration checklist