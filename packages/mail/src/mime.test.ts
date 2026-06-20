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
});