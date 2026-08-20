import type { MailAddress, MailMessage } from './types.js';

export function formatMailbox(address: MailAddress): string {
  const safeAddress = assertSafeAddress(address.address);
  if (address.name) {
    const encoded = encodeHeaderValue(address.name);
    return `"${encoded}" <${safeAddress}>`;
  }
  return safeAddress;
}

/**
 * Strips CR/LF (and other unsafe control characters) from any header field
 * value, preventing header injection. The leading/trailing whitespace is also
 * trimmed so a trailing CRLF can't split the header.
 */
function stripCrlf(value: string): string {
  return value.replace(/[\r\n\t]/g, '').trim();
}

function encodeHeaderValue(value: string): string {
  return stripCrlf(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Validates that an email address contains no CR/LF and roughly matches an
 * address form. Throws on invalid input so malicious addresses can never reach
 * a `From:`/`To:` header or an SMTP `MAIL FROM`/`RCPT TO` command.
 */
export function assertSafeAddress(address: string): string {
  if (/[\r\n]/.test(address) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address.trim())) {
    throw new Error(`Invalid mail address: ${JSON.stringify(address)}`);
  }
  return address.trim();
}

export function buildMimeMessage(message: MailMessage): string {
  const lines: string[] = [];
  lines.push(`From: ${formatMailbox(message.from!)}`);
  lines.push(`To: ${message.to.map(formatMailbox).join(', ')}`);
  if (message.cc?.length) {
    lines.push(`Cc: ${message.cc.map(formatMailbox).join(', ')}`);
  }
  if (message.replyTo) {
    lines.push(`Reply-To: ${formatMailbox(message.replyTo)}`);
  }
  lines.push(`Subject: ${encodeSubject(message.subject)}`);
  lines.push('MIME-Version: 1.0');

  if (message.html && message.text) {
    const boundary = `----=_Pondoknusa_${Date.now()}`;
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push('');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset=utf-8');
    lines.push('');
    lines.push(message.text);
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset=utf-8');
    lines.push('');
    lines.push(message.html);
    lines.push(`--${boundary}--`);
  } else if (message.html) {
    lines.push('Content-Type: text/html; charset=utf-8');
    lines.push('');
    lines.push(message.html);
  } else {
    lines.push('Content-Type: text/plain; charset=utf-8');
    lines.push('');
    lines.push(message.text ?? '');
  }

  return lines.join('\r\n');
}

export function encodeSubject(subject: string): string {
  const safe = stripCrlf(subject);
  if (/^[\x20-\x7E]*$/.test(safe)) {
    return safe;
  }
  const encoded = Buffer.from(safe, 'utf8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
}

export function dotStuff(body: string): string {
  return body
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n');
}