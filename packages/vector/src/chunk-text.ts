export interface ChunkTextOptions {
  size?: number;
  overlap?: number;
}

export function chunkText(text: string, options: ChunkTextOptions = {}): string[] {
  const size = options.size ?? 800;
  const overlap = options.overlap ?? 120;
  const normalized = text.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  if (normalized.length <= size) {
    return [normalized];
  }

  const chunks: string[] = [];
  let offset = 0;

  while (offset < normalized.length) {
    const end = Math.min(offset + size, normalized.length);
    const slice = normalized.slice(offset, end).trim();
    if (slice.length > 0) {
      chunks.push(slice);
    }
    if (end >= normalized.length) {
      break;
    }
    offset = Math.max(0, end - overlap);
  }

  return chunks;
}