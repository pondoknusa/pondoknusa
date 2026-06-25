import type { RagChunk, RerankFn } from './types.js';

export type { RerankFn };

export async function applyRerank(
  query: string,
  chunks: RagChunk[],
  rerank?: RerankFn,
): Promise<RagChunk[]> {
  if (!rerank) {
    return chunks;
  }

  return rerank(query, chunks);
}