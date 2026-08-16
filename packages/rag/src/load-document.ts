import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, resolve, sep } from 'node:path';
import { extractPdfText } from './pdf-text.js';

export interface LoadedDocument {
  content: string;
  source: string;
  mime: string;
}

export interface LoadDocumentOptions {
  /**
   * When set, `path` is resolved relative to this directory and must stay
   * inside it. Required whenever `path` comes from untrusted input.
   */
  rootDir?: string;
}

export async function loadDocument(
  path: string,
  options: LoadDocumentOptions = {},
): Promise<LoadedDocument> {
  const resolvedPath = resolveSafeDocumentPath(path, options.rootDir);
  const extension = extname(resolvedPath).toLowerCase();
  const buffer = await readFile(resolvedPath);

  switch (extension) {
    case '.txt':
      return {
        content: buffer.toString('utf8'),
        source: resolvedPath,
        mime: 'text/plain',
      };
    case '.md':
    case '.markdown':
      return {
        content: buffer.toString('utf8'),
        source: resolvedPath,
        mime: 'text/markdown',
      };
    case '.pdf':
      return {
        content: extractPdfText(buffer),
        source: resolvedPath,
        mime: 'application/pdf',
      };
    default:
      throw new Error(
        `Unsupported document type [${extension || '(none)'}]. Supported: .txt, .md, .markdown, .pdf`,
      );
  }
}

export function resolveSafeDocumentPath(path: string, rootDir?: string): string {
  if (!path || path.includes('\0')) {
    throw new Error('Invalid document path.');
  }

  if (rootDir) {
    const rootResolved = resolve(rootDir);
    const candidate = isAbsolute(path) ? resolve(path) : resolve(rootResolved, path);
    if (
      candidate !== rootResolved &&
      !candidate.startsWith(`${rootResolved}${sep}`)
    ) {
      throw new Error(`Document path escapes ingest root [${rootDir}].`);
    }
    return candidate;
  }

  if (!isAbsolute(path) && (path === '..' || path.startsWith(`..${sep}`) || path.includes(`${sep}..${sep}`))) {
    throw new Error('Relative document paths with ".." require rootDir.');
  }

  return resolve(path);
}
