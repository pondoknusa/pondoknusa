import { describe, expect, it } from 'vitest';
import { SessionIntegrity } from './session-integrity.js';

describe('SessionIntegrity', () => {
  it('round-trips sealed payloads', () => {
    const integrity = new SessionIntegrity('test-integrity-key');
    const sealed = integrity.seal({ 'auth.web': 1, theme: 'dark' });
    expect(sealed.startsWith('pn.sess.')).toBe(true);
    expect(integrity.open(sealed)).toEqual({ 'auth.web': 1, theme: 'dark' });
  });

  it('rejects unsigned payloads', () => {
    const integrity = new SessionIntegrity('test-integrity-key');
    expect(integrity.open(JSON.stringify({ 'auth.web': 1 }))).toBeNull();
  });

  it('rejects tampered macs', () => {
    const integrity = new SessionIntegrity('test-integrity-key');
    const sealed = integrity.seal({ count: 1 });
    const tampered = sealed.replace(/pn\.sess\.[^.]+\./, 'pn.sess.deadbeef.');
    expect(integrity.open(tampered)).toBeNull();
  });
});
