import { defaultGroundedPromptTemplate } from './templates/grounded-qna.js';
import type { RagChunk } from './types.js';

export function buildGroundedPrompt(
  question: string,
  chunks: RagChunk[],
  template = defaultGroundedPromptTemplate,
): string {
  const context = chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.content}${chunk.source ? ` (source: ${chunk.source})` : ''}`)
    .join('\n\n');

  return template
    .replace('{{question}}', question)
    .replace('{{context}}', context)
    .replace('{{citations}}', chunks.map((_, index) => `[${index + 1}]`).join(' '));
}