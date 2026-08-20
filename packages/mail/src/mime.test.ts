import { describe, expect, it } from 'vitest';
import { buildMimeMessage, dotStuff, formatMailbox } from './mime.js';

describe('mime', () => {
  it('formats multipart messages', () => {
    const raw = buildMimeMessage({
      subject: 'Hello',
      from: { address: 'app@example.com', name: 'App' },
      to: [{ address: 'user@example.com' }],
      text: 'plain',
      html: '<p>html</p>',
    });
    expect(raw).toContain('multipart/alternative');
    expect(raw).toContain('plain');
    expect(formatMailbox({ address: 'a@b.com', name: 'Test' })).toContain('a@b.com');
    expect(dotStuff('.hidden')).toBe('..hidden');
  });

  it('rejects CRLF injection in display names and addresses', () => {
    const withName = formatMailbox({ address: 'a@b.com', name: 'Evil\r\nBcc: x@y.com' });
    expect(withName).not.toContain('\r');
    expect(withName).not.toContain('\n');
    expect(() => formatMailbox({ address: 'a@b.com\r\nRCPT TO:<x@y.com>' }))
      .toThrow(/Invalid mail address/);
  });

  it('strips CRLF from Subject headers', () => {
    const raw = buildMimeMessage({
      subject: 'Hello\r\nBcc: evil@example.com',
      from: { address: 'app@example.com' },
      to: [{ address: 'user@example.com' }],
      text: 'plain',
    });
    expect(raw).not.toContain('\r\nBcc:');
    expect(raw).toContain('Subject: HelloBcc: evil@example.com');
  });
});