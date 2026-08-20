import { inflateSync } from 'node:zlib';

export interface ExtractPdfTextOptions {
  /** Maximum bytes a single FlateDecode stream may decompress to. Guards against decompression bombs. */
  maxInflateBytes?: number;
}

export function extractPdfText(buffer: Buffer, options: ExtractPdfTextOptions = {}): string {
  const latin = buffer.toString('latin1');
  const inflated = inflatePdfStreams(latin, options.maxInflateBytes ?? 50 * 1024 * 1024);
  const texts: string[] = [];

  for (const match of inflated.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    const raw = match[0]?.slice(1, match[0].lastIndexOf(')'));
    if (raw) {
      texts.push(decodePdfLiteral(raw));
    }
  }

  for (const match of inflated.matchAll(/\[((?:\([^)]*\)|<[^>]*>|-?\d+(?:\.\d+)?|\s)+)\]\s*TJ/g)) {
    const arrayBody = match[1] ?? '';
    for (const part of arrayBody.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      const raw = part[0]?.slice(1, part[0].length - 1);
      if (raw) {
        texts.push(decodePdfLiteral(raw));
      }
    }
  }

  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

function inflatePdfStreams(content: string, maxInflateBytes: number): string {
  const chunks: string[] = [];
  const pattern = /<<([^>]*)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;

  for (const match of content.matchAll(pattern)) {
    const dict = match[1] ?? '';
    const body = match[2] ?? '';
    if (!/\/FlateDecode/.test(dict)) {
      chunks.push(body);
      continue;
    }

    try {
      const compressed = Buffer.from(body, 'latin1');
      chunks.push(inflateSync(compressed, { maxOutputLength: maxInflateBytes }).toString('latin1'));
    } catch (error) {
      if (error instanceof RangeError) {
        throw new Error('PDF stream exceeded maximum decompression size (possible decompression bomb).');
      }
      chunks.push(body);
    }
  }

  return chunks.length > 0 ? `${content}\n${chunks.join('\n')}` : content;
}

function decodePdfLiteral(value: string): string {
  return value
    .replaceAll(/\\([nrtbf()\\])/g, (_, token: string) => {
      switch (token) {
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        case '(':
          return '(';
        case ')':
          return ')';
        case '\\':
          return '\\';
        default:
          return token;
      }
    })
    .replaceAll(/\\(\d{1,3})/g, (_, octal: string) =>
      String.fromCharCode(Number.parseInt(octal, 8)),
    );
}