import type { GraphQLFormattedError } from './types.js';

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
}

export class GraphQLParseError extends GraphQLError {
  constructor(message: string) {
    super(message, undefined, { code: 'GRAPHQL_PARSE_ERROR' });
    this.name = 'GraphQLParseError';
  }
}