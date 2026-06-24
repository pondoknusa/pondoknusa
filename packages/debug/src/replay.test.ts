import { describe, expect, it } from 'vitest';
import { buildReplaySnippets } from './replay.js';

describe('buildReplaySnippets', () => {
  it('builds curl and fetch replay snippets', () => {
    const snippets = buildReplaySnippets({
      method: 'POST',
      url: 'http://127.0.0.1:3000/users',
      headers: {
        'content-type': 'application/json',
        authorization: '[REDACTED]',
      },
      body: '{"name":"Ada"}',
    });

    expect(snippets.curl).toContain("curl -X POST 'http://127.0.0.1:3000/users'");
    expect(snippets.curl).toContain('--data');
    expect(snippets.fetch).toContain("method: \"POST\"");
    expect(snippets.fetch).toContain('Ada');
  });
});