export class ViewCompileError extends Error {
  readonly viewPath?: string;
  readonly line?: number;
  readonly column?: number;

  constructor(
    message: string,
    options: { viewPath?: string; line?: number; column?: number } = {},
  ) {
    const location = formatCompileLocation(options.viewPath, options.line, options.column);
    super(location ? `${message} (${location})` : message);
    this.name = 'ViewCompileError';
    this.viewPath = options.viewPath;
    this.line = options.line;
    this.column = options.column;
  }
}

export function formatCompileLocation(
  viewPath?: string,
  line?: number,
  column?: number,
): string | undefined {
  if (!viewPath && line === undefined) {
    return undefined;
  }

  const parts: string[] = [];
  if (viewPath) {
    parts.push(viewPath);
  }
  if (line !== undefined) {
    parts.push(`line ${line}`);
  }
  if (column !== undefined) {
    parts.push(`column ${column}`);
  }
  return parts.join(', ');
}

export function lineColumnAt(source: string, index: number): { line: number; column: number } {
  let line = 1;
  let column = 1;

  for (let cursor = 0; cursor < index && cursor < source.length; cursor += 1) {
    if (source[cursor] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
}