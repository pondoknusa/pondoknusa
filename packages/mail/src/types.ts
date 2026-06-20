export interface MailAddress {
  address: string;
  name?: string;
}

export interface MailMessage {
  subject: string;
  from?: MailAddress;
  to: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
  replyTo?: MailAddress;
  text?: string;
  html?: string;
  tags?: string[];
}

export interface ArrayMailConfig {
  driver: 'array';
}

export interface LogMailConfig {
  driver: 'log';
  channel?: 'stdout' | 'stderr';
}

export type MailConnectionConfig = ArrayMailConfig | LogMailConfig;

export interface MailConfig {
  default: string;
  from: MailAddress;
  connections: Record<string, MailConnectionConfig>;
}