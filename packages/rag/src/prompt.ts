import { defaultGroundedPromptTemplate } from './templates/grounded-qna.js';
import type { RagChunk } from './types.js';

function neutralizeTemplateTokens(value: string): string {
  return value.replace(/\{\{/g, '[').replace(/\}\}/g, ']');
}

export function buildGroundedPrompt(
  question: string,
  chunks: RagChunk[],
  template = defaultGroundedPromptTemplate,
): string {
  const context = chunks
    .map((chunk, index) => {
      const safeContent = neutralizeTemplateTokens(chunk.content);
      const source = chunk.source ? ` (source: ${neutralizeTemplateTokens(chunk.source)})` : '';
      return `<<RETRIEVED DOCUMENT ${index + 1}${source}>>\n${safeContent}\n<</RETRIEVED DOCUMENT ${index + 1}>>`;
    })
    .join('\n\n');

  return template
    .replace('{{question}}', neutralizeTemplateTokens(question))
    .replace('{{context}}', context)
    .replace('{{citations}}', chunks.map((_, index) => `[${index + 1}]`).join(' '));
}