import type { ModelStatic } from '@pondoknusa/database';
import { ingestDocument } from './ingest.js';
import { loadDocument, type LoadDocumentOptions } from './load-document.js';
import type { IngestDocumentOptions } from './types.js';

export interface IngestFileOptions extends IngestDocumentOptions, LoadDocumentOptions {
  source?: string;
  metadata?: Record<string, unknown>;
}

export async function ingestFile(
  model: ModelStatic,
  path: string,
  options: IngestFileOptions = {},
): Promise<Array<number | bigint | undefined>> {
  const loaded = await loadDocument(path, { rootDir: options.rootDir });
  return ingestDocument(
    model,
    {
      source: options.source ?? loaded.source,
      content: loaded.content,
      metadata: {
        mime: loaded.mime,
        ...options.metadata,
      },
    },
    options,
  );
}