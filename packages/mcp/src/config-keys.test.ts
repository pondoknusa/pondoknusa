import { describe, expect, it } from 'vitest';
import { isSensitiveConfigKey } from './config-keys.js';

describe('isSensitiveConfigKey', () => {
  it('flags high-value keys previously missed', () => {
    expect(isSensitiveConfigKey('app.key')).toBe(true);
    expect(isSensitiveConfigKey('database.url')).toBe(true);
    expect(isSensitiveConfigKey('redis.url')).toBe(true);
    expect(isSensitiveConfigKey('database.connections.postgres.password')).toBe(true);
  });

  it('does not flag ordinary keys', () => {
    expect(isSensitiveConfigKey('app.name')).toBe(false);
    expect(isSensitiveConfigKey('mail.from')).toBe(false);
    expect(isSensitiveConfigKey('app.url')).toBe(false);
    expect(isSensitiveConfigKey('database.host')).toBe(false);
    expect(isSensitiveConfigKey('mail.username')).toBe(false);
  });
});
