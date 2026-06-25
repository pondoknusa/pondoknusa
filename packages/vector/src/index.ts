import './model-extensions.js';

export {
  createCachedEmbedFn,
  embeddingCacheKey,
  type EmbeddingCacheOptions,
} from './embedding-cache.js';
export { finalizeVectorResults } from './rank-results.js';
export { chunkText, type ChunkTextOptions } from './chunk-text.js';
export {
  cosineDistance,
  distanceToScore,
  innerProductDistance,
  l2Distance,
  vectorDistance,
} from './distance.js';
export {
  clearEmbedModels,
  registerEmbedModel,
  resolveEmbedModel,
} from './embed-model-registry.js';
export {
  formatEmbeddingForStorage,
  resetEmbeddingFormatter,
  setEmbeddingFormatter,
  type EmbeddingFormatter,
} from './embedding-format.js';
export { EmbedChunksJob, setEmbedChunksHandler, type EmbedChunksPayload } from './embed-chunks-job.js';
export { MemoryVectorStore } from './memory-vector-store.js';
export {
  getVectorSearchDriver,
  registerVectorSearchDriver,
  searchVectors,
  type VectorSearchDriver,
} from './search-driver.js';
export { blendHybridScore, textMatchScore } from './hybrid-search.js';
export {
  matchesMetadataFilters,
  parseMetadataColumn,
  type MetadataFilter,
  type MetadataFilterOperator,
} from './metadata-filters.js';
export { registerInMemoryVectorSearchDriver, registerLocalVectorSearchDriver, registerSqliteVectorSearchDriver } from './register-local.js';
export { MemoryVectorSearchDriver } from './memory-search-driver.js';
export { SqliteVectorSearchDriver } from './sqlite-vector-search-driver.js';
export { nearestOnBuilder, scopeNearest, similarTo, VectorSearch } from './vector-search.js';
export { registerModelVectorSearch } from './model-extensions.js';
export type {
  EmbedFn,
  Embedding,
  VectorMetric,
  VectorRecord,
  VectorSearchOptions,
} from './types.js';