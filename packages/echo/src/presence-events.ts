import type { EchoConnector, EchoListener, PresenceCallbacks } from './types.js';

const PRESENCE_EVENTS = {
  here: 'presence:subscribed',
  joining: 'presence:joining',
  leaving: 'presence:leaving',
} as const;

type PresenceBinding = {
  event: string;
  listener: EchoListener;
};

const presenceBindings = new WeakMap<EchoConnector, Map<string, PresenceBinding[]>>();

export function bindConnectorPresenceEvents(
  connector: EchoConnector,
  channelName: string,
  callbacks: PresenceCallbacks,
  _driver: 'websocket',
): void {
  unbindConnectorPresenceEvents(connector, channelName);

  const bindings: PresenceBinding[] = [];

  if (callbacks.here) {
    const listener = createHereListener(callbacks.here);
    connector.listen(channelName, PRESENCE_EVENTS.here, listener);
    bindings.push({ event: PRESENCE_EVENTS.here, listener });
  }

  if (callbacks.joining) {
    const listener = createJoiningListener(callbacks.joining);
    connector.listen(channelName, PRESENCE_EVENTS.joining, listener);
    bindings.push({ event: PRESENCE_EVENTS.joining, listener });
  }

  if (callbacks.leaving) {
    const listener = createLeavingListener(callbacks.leaving);
    connector.listen(channelName, PRESENCE_EVENTS.leaving, listener);
    bindings.push({ event: PRESENCE_EVENTS.leaving, listener });
  }

  if (callbacks.error) {
    connector.listen(channelName, 'error', callbacks.error);
    bindings.push({ event: 'error', listener: callbacks.error });
  }

  if (bindings.length === 0) {
    return;
  }

  const byChannel = presenceBindings.get(connector) ?? new Map<string, PresenceBinding[]>();
  byChannel.set(channelName, bindings);
  presenceBindings.set(connector, byChannel);
}

export function unbindConnectorPresenceEvents(
  connector: EchoConnector,
  channelName: string,
): void {
  const byChannel = presenceBindings.get(connector);
  const bindings = byChannel?.get(channelName);
  if (!bindings) {
    return;
  }

  for (const binding of bindings) {
    connector.stopListening(channelName, binding.event, binding.listener);
  }

  byChannel?.delete(channelName);
}

function createHereListener(callback: (members: unknown[]) => void): EchoListener {
  return (payload) => {
    const members = Array.isArray(payload) ? payload : [];
    callback(members.map((member) => extractMemberInfo(member)));
  };
}

function createJoiningListener(callback: (member: unknown) => void): EchoListener {
  return (payload) => {
    callback(extractMemberInfo(payload));
  };
}

function createLeavingListener(callback: (member: unknown) => void): EchoListener {
  return createJoiningListener(callback);
}

function extractMemberInfo(member: unknown): unknown {
  if (member && typeof member === 'object' && 'user_info' in member) {
    return (member as { user_info: unknown }).user_info;
  }

  return member;
}