import { createHash } from 'node:crypto';
import type { CacheStore } from '@pondoknusa/cache';
import type { GraphQLContext, GraphQLExecutionResult, GraphQLRequestPayload } from './types.js';

export function graphqlCacheIdentity(context: GraphQLContext = {}): string {
  const tenant = context.tenantId == null || context.tenantId === '' ? 'none' : String(context.tenantId);
  const user = context.userId == null || context.userId === '' ? 'anonymous' : String(context.userId);
  return `${tenant}:${user}`;
}

export function buildGraphQLCacheKey(
  payload: GraphQLRequestPayload,
  context: GraphQLContext = {},
): string {
  const digest = createHash('sha256')
    .update(JSON.stringify({
      identity: graphqlCacheIdentity(context),
      query: payload.query ?? '',
      operationName: payload.operationName ?? '',
      variables: payload.variables ?? {},
    }))
    .digest('hex');

  return `graphql:response:${digest}`;
}

export async function rememberGraphQLResponse(
  cache: CacheStore,
  key: string,
  ttlSeconds: number,
  callback: () => Promise<GraphQLExecutionResult>,
): Promise<GraphQLExecutionResult> {
  const cached = await cache.get<GraphQLExecutionResult>(key);
  if (cached) {
    return cached;
  }

  const result = await callback();
  if (!result.errors?.length) {
    await cache.put(key, result, ttlSeconds);
  }

  return result;
}