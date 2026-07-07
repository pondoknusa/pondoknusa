import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';

export interface SnapshotOptions {
  directory?: string;
  update?: boolean;
}

function resolveSnapshotPath(name: string, directory = '__snapshots__'): string {
  const base = isAbsolute(directory) ? directory : join(process.cwd(), directory);
  return join(base, `${name}.snap`);
}

export async function assertJsonSnapshot(
  actual: unknown,
  name: string,
  options: SnapshotOptions = {},
): Promise<void> {
  const normalized = `${JSON.stringify(actual, null, 2)}\n`;
  await assertSnapshotContent(normalized, name, options);
}

export async function assertHtmlSnapshot(
  actual: string,
  name: string,
  options: SnapshotOptions = {},
): Promise<void> {
  await assertSnapshotContent(`${actual.trim()}\n`, name, options);
}

async function assertSnapshotContent(
  content: string,
  name: string,
  options: SnapshotOptions,
): Promise<void> {
  const path = resolveSnapshotPath(name, options.directory);
  const shouldUpdate = options.update ?? process.env.UPDATE_SNAPSHOTS === '1';

  if (shouldUpdate) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
    return;
  }

  let expected: string;
  try {
    expected = await readFile(path, 'utf8');
  } catch {
    throw new Error(`Snapshot [${name}] is missing at ${path}. Run with UPDATE_SNAPSHOTS=1 to create it.`);
  }

  if (expected !== content) {
    throw new Error(`Snapshot [${name}] does not match.\n--- expected\n+++ actual\n${diffLines(expected, content)}`);
  }
}

function diffLines(expected: string, actual: string): string {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const max = Math.max(expectedLines.length, actualLines.length);
  const lines: string[] = [];

  for (let index = 0; index < max; index += 1) {
    const left = expectedLines[index] ?? '';
    const right = actualLines[index] ?? '';
    if (left !== right) {
      lines.push(`-${left}`);
      lines.push(`+${right}`);
    }
  }

  return lines.join('\n');
}