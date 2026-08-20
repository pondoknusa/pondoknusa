import { describe, expect, it } from 'vitest';
import { PondoknusaRequest } from '@pondoknusa/http';
import { createGraphQLHandler } from './handler.js';
import { createOperationRegistry } from './operations.js';
import { defineSchema } from './schema.js';

const schema = defineSchema({
  Query: {
    hello: {
      resolve: () => 'world',
    },
  },
});

describe('createGraphQLHandler', () => {
  it('handles POST requests with inline queries', async () => {
    const handler = createGraphQLHandler({ schema });
    const request = new PondoknusaRequest(
      new Request('http://localhost/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ hello }' }),
      }),
    );

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { hello: 'world' } });
  });

  it('rejects mutations over GET', async () => {
    const mutatingSchema = defineSchema({
      Query: {
        hello: {
          resolve: () => 'world',
        },
      },
      Mutation: {
        ping: {
          resolve: () => 'pong',
        },
      },
    });
    const handler = createGraphQLHandler({ schema: mutatingSchema });
    const request = new PondoknusaRequest(
      new Request('http://localhost/graphql?query=mutation%20%7B%20ping%20%7D'),
    );

    const response = await handler(request);
    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({
      errors: [{ message: 'Mutations are not allowed over GET.' }],
    });
  });

  it('handles GET requests with query parameters', async () => {
    const handler = createGraphQLHandler({ schema });
    const request = new PondoknusaRequest(
      new Request('http://localhost/graphql?query=%7B%20hello%20%7D'),
    );

    const response = await handler(request);
    expect(await response.json()).toEqual({ data: { hello: 'world' } });
  });

  it('rejects invalid GET variables JSON', async () => {
    const handler = createGraphQLHandler({ schema });
    const request = new PondoknusaRequest(
      new Request('http://localhost/graphql?query=%7B%20hello%20%7D&variables=not-json'),
    );

    const response = await handler(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      errors: [{ message: 'Invalid GraphQL request JSON.' }],
    });
  });

  it('executes named persisted operations when registered', async () => {
    const operations = createOperationRegistry([
      {
        name: 'Hello',
        type: 'query',
        document: 'query Hello { hello }',
      },
    ]);
    const handler = createGraphQLHandler({ schema, operations });
    const request = new PondoknusaRequest(
      new Request('http://localhost/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operationName: 'Hello' }),
      }),
    );

    const response = await handler(request);
    expect(await response.json()).toEqual({ data: { hello: 'world' } });
  });
});