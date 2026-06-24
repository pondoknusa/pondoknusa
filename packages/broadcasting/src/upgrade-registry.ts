import type { Server } from 'node:http';

type UpgradeRegistrar = (server: Server) => void;

let registrar: UpgradeRegistrar | undefined;

export function setBroadcastWebSocketUpgrade(registrarFn: UpgradeRegistrar): void {
  registrar = registrarFn;
}

export function clearBroadcastWebSocketUpgrade(): void {
  registrar = undefined;
}

export function attachBroadcastWebSocketUpgrade(server: Server): void {
  registrar?.(server);
}