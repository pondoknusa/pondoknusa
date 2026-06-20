export type { MailAddress, MailConfig, MailConnectionConfig, MailMessage, SmtpMailConfig } from './types.js';
export { SmtpMailTransport } from './smtp-transport.js';
export { buildMimeMessage } from './mime.js';
export { Mailable } from './mailable.js';
export { MailManager, Mailer } from './mail-manager.js';
export {
  ArrayMailTransport,
  LogMailTransport,
  type MailTransport,
} from './transport.js';