import type { Notification } from './notification.js';

/** Marker interface — notifications that implement this are queued. */
export interface ShouldQueue {}

export function shouldQueue(notification: Notification): boolean {
  return notification.shouldQueue?.() === true;
}