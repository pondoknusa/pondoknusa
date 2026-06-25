import type { Embedding } from './types.js';

export type EmbeddingFormatter = (embedding: Embedding) => unknown;

let formatter: EmbeddingFormatter = (embedding) => JSON.stringify(embedding);

export function setEmbeddingFormatter(next: EmbeddingFormatter): void {
  formatter = next;
}

export function formatEmbeddingForStorage(embedding: Embedding): unknown {
  return formatter(embedding);
}

export function resetEmbeddingFormatter(): void {
  formatter = (embedding) => JSON.stringify(embedding);
}