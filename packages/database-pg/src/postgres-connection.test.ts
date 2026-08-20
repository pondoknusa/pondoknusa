import { describe, expect, it } from 'vitest';
import { resolvePgSsl } from './postgres-connection.js';

describe('resolvePgSsl', () => {
  it('disables TLS when ssl is undefined or false', () => {
    expect(resolvePgSsl(undefined)).toBeUndefined();
    expect(resolvePgSsl(false)).toBeUndefined();
  });

  it('verifies server certificates by default when ssl is true', () => {
    expect(resolvePgSsl(true)).toEqual({ rejectUnauthorized: true });
  });

  it('verifies server certificates by default for object options', () => {
    expect(resolvePgSsl({ ca: 'CA_PEM' })).toEqual({
      rejectUnauthorized: true,
      ca: 'CA_PEM',
    });
  });

  it('allows explicitly opting out of certificate verification', () => {
    expect(resolvePgSsl({ rejectUnauthorized: false })).toEqual({
      rejectUnauthorized: false,
    });
  });
});
