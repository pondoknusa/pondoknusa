import { blendHybridScore, textMatchScore } from './hybrid-search.js';
import { matchesMetadataFilters, parseMetadataColumn } from './metadata-filters.js';
import type { VectorSearchOptions } from './types.js';

export function finalizeVectorResults(
  rows: Record<string, unknown>[],
  options: VectorSearchOptions = {},
): Record<string, unknown>[] {
  const limit = options.limit ?? 10;
  const threshold = options.threshold;
  const metadataColumn = options.metadataColumn ?? 'metadata';
  const metadataFilters = options.metadataFilters ?? [];
  const hybrid = options.hybrid;

  const filtered: Record<string, unknown>[] = [];

  for (const row of rows) {
    const metadata = parseMetadataColumn(row[metadataColumn]);
    if (!matchesMetadataFilters(metadata, metadataFilters)) {
      continue;
    }

    let score = Number(row.score ?? 0);
    if (hybrid) {
      const textColumn = hybrid.textColumn ?? 'content';
      const textScore = textMatchScore(row[textColumn], hybrid.textQuery);
      score = blendHybridScore(score, textScore, hybrid.vectorWeight ?? 0.6);
    }

    if (threshold !== undefined && score < threshold) {
      continue;
    }

    filtered.push({
      ...row,
      score,
      distance: row.distance ?? Math.max(0, 1 - score),
    });
  }

  return filtered
    .sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0))
    .slice(0, limit);
}