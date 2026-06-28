# Broadcasting & realtime

Push server events to browser clients over Tyravel's native WebSocket hub (since **v0.13.0**).

## Architecture

```
Controller / Event  →  Broadcast facade  →  WebSocket hub (/tyravel/ws)
                              ↓
                         Redis pub/sub (multi-process fan-out)
                              ↓
                         @tyravel/echo (browser WebSocket client)
```

No Socket.io or Pusher — the browser uses the native `WebSocket` API.

## Server setup

### 1. Scaffold with Redis

```bash
tyravel new my-app --redis
```

Or add `@tyravel/broadcasting-websocket` and `@tyravel/redis-node` manually.

### 2. Config

```typescript
// config/broadcasting.ts
export default {
  default: env('BROADCAST_CONNECTION', 'websocket'),
  connections: {
    websocket: {
      driver: 'websocket',
      redisConnection: env('REDIS_CONNECTION', 'default'),
      channel: env('BROADCAST_REDIS_CHANNEL', 'tyravel:broadcast'),
      path: '/tyravel/ws',
    },
  },
};
```

### 3. Provider

```typescript
import { WebSocketBroadcastServiceProvider } from '@tyravel/broadcasting-websocket';
```

### 4. Channel authorization

`routes/channels.ts` (scaffolded since v0.16):

```typescript
import { Broadcast } from '@tyravel/core';

Broadcast.channel('orders', () => true);

Broadcast.channel('private-orders.{orderId}', (user, orderId) => {
  return Boolean(user);
});
```

Private channels use the `private-` prefix to match Echo client subscriptions.

## Broadcasting events

```typescript
import { Broadcast } from '@tyravel/core';

await Broadcast.to('orders').emit('OrderShipped', { id: order.id });
```

Queue broadcast jobs when `config/broadcasting.ts` sets `queue` / `queueConnection`.

## Client (`@tyravel/echo`)

```typescript
import { Echo, readEchoConfigFromDocument } from '@tyravel/echo';

const config = readEchoConfigFromDocument();
if (config) {
  const echo = new Echo(config);
  echo.private(`orders.${orderId}`).listen('OrderShipped', handler);
}
```

`@vite` or view helpers inject Echo config when the websocket driver is active.

## Production deployment

| Concern | Recommendation |
|---------|----------------|
| **Path** | Reverse-proxy `/tyravel/ws` with WebSocket upgrade headers |
| **Redis** | Required when running multiple app processes |
| **TLS** | Terminate WSS at the proxy; Echo uses `wss://` from `APP_URL` |
| **Auth** | `/broadcasting/auth` issues channel tokens — keep behind session middleware |

### Nginx sketch

```nginx
location /tyravel/ws {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

## Local development

```bash
tyravel serve
```

Single-process mode works without Redis; add Redis when testing multi-worker fan-out.

## Related

- [Cookbook: Realtime UI with Echo](/cookbook/realtime-echo)
- [Tutorial 4: Realtime & deploy](/tutorials/04-realtime-and-deploy)
- [0.13.0 migration](https://github.com/thesimonharms/tyravel/blob/main/CHANGELOG.md#0130---2026-06-25)