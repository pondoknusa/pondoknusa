export type { MailAddress, MailConfig, MailConnectionConfig, MailMessage } from './types.js';
export { Mailable } from './mailable.js';
export { MailManager, Mailer } from './mail-manager.js';
export {
  ArrayMailTransport,
  LogMailTransport,
  type MailTransport,
} from './transport.js';