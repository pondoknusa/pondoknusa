import { readFile } from 'node:fs/promises';
import { buildGroundedPrompt } from './prompt.js';
import { defaultGroundedPromptTemplate } from './templates/grounded-qna.js';
import type { RagChunk } from './types.js';

export { defaultGroundedPromptTemplate };

export async function loadPromptTemplate(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

export function renderGroundedPrompt(
  question: string,
  chunks: RagChunk[],
  template = defaultGroundedPromptTemplate,
): string {
  return buildGroundedPrompt(question, chunks, template);
}