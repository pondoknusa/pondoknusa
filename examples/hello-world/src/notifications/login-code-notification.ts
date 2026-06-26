import { Notification } from '@tyravel/notifications';
import type { Notifiable, SmsMessage } from '@tyravel/notifications';

/**
 * Example SMS notification — wire `setSmsTransport()` in AppServiceProvider
 * to swap the default console stub for Twilio or another provider.
 */
export class LoginCodeNotification extends Notification {
  constructor(private readonly code: string) {
    super();
  }

  override via(): Array<'sms'> {
    return ['sms'];
  }

  override toSms(notifiable: Notifiable): SmsMessage {
    const to = notifiable.routeNotificationForSms?.();
    if (!to) {
      throw new Error('Notifiable is missing routeNotificationForSms().');
    }

    return {
      to,
      body: `Your Tyravel login code is ${this.code}`,
    };
  }
}