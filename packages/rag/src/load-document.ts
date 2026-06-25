import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { extractPdfText } from './pdf-text.js';

export interface LoadedDocument {
  content: string;
  source: string;
  mime: string;
}

export async function loadDocument(path: string): Promise<LoadedDocument> {
  const extension = extname(path).toLowerCase();
  const buffer = await readFile(path);

  switch (extension) {
    case '.txt':
      return {
        content: buffer.toString('utf8'),
        source: path,
        mime: 'text/plain',
      };
    case '.md':
    case '.markdown':
      return {
        content: buffer.toString('utf8'),
        source: path,
        mime: 'text/markdown',
      };
    case '.pdf':
      return {
        content: extractPdfText(buffer),
        source: path,
        mime: 'application/pdf',
      };
    default:
      throw new Error(
        `Unsupported document type [${extension || '(none)'}]. Supported: .txt, .md, .markdown, .pdf`,
      );
  }
}