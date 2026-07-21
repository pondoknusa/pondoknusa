import { describe, expect, it } from 'vitest';
import { collectBootEnvFailures, validateBootEnv } from './validate-boot-env.js';
import { ConfigValidationError } from './config-validation-error.js';

describe('validateBootEnv', () => {
  it('flags incomplete OAuth provider credentials', () => {
    const failures = collectBootEnvFailures({
      auth: {
        oauth: {
          providers: {
            github: {
              clientId: 'abc',
              clientSecret: '',
              redirectUri: 'http://127.0.0.1:3000/callback',
            },
          },
        },
      },
    });

    expect(failures.some((failure) => failure.path.includes('clientSecret'))).toBe(true);
  });

  it('skips OAuth providers without a client id', () => {
    const failures = collectBootEnvFailures({
      auth: {
        oauth: {
          providers: {
            github: {
              clientId: '',
              clientSecret: '',
            },
          },
        },
      },
    });

    expect(failures).toHaveLength(0);
  });

  it('requires database connection entries for the default driver', () => {
    expect(() =>
      validateBootEnv({
        database: {
          default: 'mysql',
          connections: {},
        },
      }),
    ).toThrow(ConfigValidationError);
  });

  it('requires D1 binding or remote credentials', () => {
    const failures = collectBootEnvFailures({
      database: {
        default: 'd1',
        connections: {
          d1: { driver: 'd1' },
        },
      },
    });

    expect(failures.some((failure) => failure.message.includes('D1 requires'))).toBe(
      true,
    );
  });

  it('accepts D1 remote credentials', () => {
    const failures = collectBootEnvFailures({
      database: {
        default: 'd1',
        connections: {
          d1: {
            driver: 'd1',
            accountId: 'acct',
            databaseId: 'db-id',
            apiToken: 'token',
          },
        },
      },
    });

    expect(failures).toHaveLength(0);
  });

  it('accepts a D1 Workers binding', () => {
    const failures = collectBootEnvFailures({
      database: {
        default: 'd1',
        connections: {
          d1: {
            driver: 'd1',
            binding: {},
          },
        },
      },
    });

    expect(failures).toHaveLength(0);
  });
});