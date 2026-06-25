export function textMatchScore(content: unknown, query: string): number {
  const haystack = String(content ?? '').toLowerCase();
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return 0;
  }

  if (haystack.includes(needle)) {
    return 1;
  }

  const tokens = needle.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return 0;
  }

  const matched = tokens.filter((token) => haystack.includes(token)).length;
  return matched / tokens.length;
}

export function blendHybridScore(
  vectorScore: number,
  textScore: number,
  vectorWeight = 0.6,
): number {
  const weight = Math.min(1, Math.max(0, vectorWeight));
  return weight * vectorScore + (1 - weight) * textScore;
}