import { Route } from '@tyravel/core';
import { ArrayStore } from '@tyravel/cache';
import {
  createGraphQLHandler,
  createOperationRegistry,
  defineSchema,
  defineType,
} from '@tyravel/graphql';
import { Document } from '../models/document.js';

const cache = new ArrayStore();

const schema = defineSchema({
  Query: {
    hello: {
      resolve: () => 'Tyravel RAG',
    },
    documents: {
      resolve: async () => Document.query().limit(10).get(),
    },
  },
  types: {
    Document: defineType({
      id: {
        resolve: (parent) => (parent as { id: number }).id,
      },
      source: {
        resolve: (parent) => (parent as { source: string }).source,
      },
      content: {
        resolve: (parent) => (parent as { content: string }).content,
      },
    }),
  },
});

const operations = createOperationRegistry([
  {
    name: 'Hello',
    type: 'query',
    document: 'query Hello { hello }',
  },
  {
    name: 'Documents',
    type: 'query',
    document: 'query Documents { documents { id source content } }',
  },
]);

export function registerGraphQLRoutes(): void {
  Route.post('/graphql', createGraphQLHandler({
    schema,
    operations,
    cache,
    defaultCacheTtl: 30,
  }));

  Route.get('/graphql', createGraphQLHandler({
    schema,
    operations,
    cache,
    defaultCacheTtl: 30,
  }));
}