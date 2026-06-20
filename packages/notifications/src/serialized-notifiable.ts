import type { Notifiable } from './types.js';

export interface SerializedNotifiableData {
  type: string;
  id: string | number;
  mail?: string;
}

export class SerializedNotifiable implements Notifiable {
  constructor(private readonly data: SerializedNotifiableData) {}

  getKey(): string | number {
    return this.data.id;
  }

  routeNotificationForMail(): string {
    return this.data.mail ?? '';
  }
}

export function serializeNotifiable(notifiable: Notifiable): SerializedNotifiableData {
  const mail = notifiable.routeNotificationForMail?.();
  return {
    type: notifiable.constructor.name,
    id: notifiable.getKey(),
    mail: typeof mail === 'string' ? mail : mail?.address,
  };
}