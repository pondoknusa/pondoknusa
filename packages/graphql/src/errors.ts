import { randomUUID } from 'node:crypto';
import type { GraphQLFormattedError } from './types.js';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export class GraphQLError extends Error {
  constructor(
    message: string,
    readonly path?: Array<string | number>,
    readonly extensions?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'GraphQLError';
  }

  format(): GraphQLFormattedError {
    return {
      message: this.message,
      path: this.path,
      extensions: this.extensions,
    };
  }

  withPath(path: Array<string | number>): GraphQLError {
    return new GraphQLError(this.message, path, this.extensions);
  }
}

/**
 * Format an unexpected (non-GraphQLError) exception for the client. In
 * production the raw message is suppressed and replaced with a generic error
 * plus a correlation id that is logged server-side, preventing information
 * disclosure of internal details (SQL, paths, etc.).
 */
export function formatInternalError(error: unknown): GraphQLError {
  if (error instanceof GraphQLError) {
    return error;
  }
  const requestId = randomUUID();
  if (!isProduction()) {
    return new GraphQLError(
      error instanceof Error ? error.message : String(error),
      undefined,
      { code: 'INTERNAL_ERROR', requestId },
    );
  }
  console.error(`[graphql:${requestId}]`, error);
  return new GraphQLError(
    'Internal server error.',
    undefined,
    { code: 'INTERNAL_ERROR', requestId },
  );
}

export class GraphQLParseError extends GraphQLError {
  constructor(message: string) {
    super(message, undefined, { code: 'GRAPHQL_PARSE_ERROR' });
    this.name = 'GraphQLParseError';
  }
}