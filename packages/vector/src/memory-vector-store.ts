import { distanceToScore, vectorDistance } from './distance.js';
import type { Embedding, VectorMetric, VectorRecord, VectorSearchOptions } from './types.js';

export class MemoryVectorStore {
  private readonly records = new Map<string | number, VectorRecord>();
  private nextId = 1;

  upsert(record: VectorRecord): VectorRecord {
    const id = record.id ?? this.nextId++;
    const stored = { ...record, id };
    this.records.set(id, stored);
    return stored;
  }

  search(embedding: Embedding, options: VectorSearchOptions = {}): VectorRecord[] {
    const metric = options.metric ?? 'cosine';
    const limit = options.limit ?? 10;
    const threshold = options.threshold;

    const ranked = [...this.records.values()]
      .map((record) => {
        const distance = vectorDistance(embedding, record.embedding, metric);
        const score = distanceToScore(distance, metric);
        return { ...record, distance, score };
      })
      .filter((record) => threshold === undefined || (record.score ?? 0) >= threshold)
      .sort((left, right) => (left.distance ?? 0) - (right.distance ?? 0))
      .slice(0, limit);

    return ranked;
  }

  clear(): void {
    this.records.clear();
    this.nextId = 1;
  }
}