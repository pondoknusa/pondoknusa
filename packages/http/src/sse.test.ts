import { describe, expect, it } from 'vitest';
import { formatSseEvent } from './sse.js';
import { Response } from './response.js';

describe('SSE responses', () => {
  it('formats event stream payloads', () => {
    expect(formatSseEvent({ event: 'token', data: '{"token":"hi"}' }))
      .toBe('event: token\ndata: {"token":"hi"}\n\n');
  });

  it('returns a text/event-stream response', async () => {
    async function* events() {
      yield { event: 'done', data: '{"ok":true}' };
    }

    const response = Response.sse(events());
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(await response.text()).toBe('event: done\ndata: {"ok":true}\n\n');
  });
});