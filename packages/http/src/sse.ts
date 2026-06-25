export interface SseEvent {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

export function formatSseEvent(event: SseEvent): string {
  const lines: string[] = [];
  if (event.event) {
    lines.push(`event: ${event.event}`);
  }
  if (event.id) {
    lines.push(`id: ${event.id}`);
  }
  if (event.retry !== undefined) {
    lines.push(`retry: ${event.retry}`);
  }

  for (const line of event.data.split(/\r?\n/)) {
    lines.push(`data: ${line}`);
  }

  return `${lines.join('\n')}\n\n`;
}

export async function* encodeSseEvents(
  source: AsyncIterable<SseEvent>,
): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  for await (const event of source) {
    yield encoder.encode(formatSseEvent(event));
  }
}