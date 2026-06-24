import type { RequestSnapshot } from './request-snapshot.js';

export interface ReplaySnippets {
  curl: string;
  fetch: string;
}

export function buildReplaySnippets(snapshot: RequestSnapshot): ReplaySnippets {
  return {
    curl: buildCurlSnippet(snapshot),
    fetch: buildFetchSnippet(snapshot),
  };
}

function buildCurlSnippet(snapshot: RequestSnapshot): string {
  const parts = ['curl', '-X', snapshot.method, shellQuote(snapshot.url)];

  for (const [key, value] of Object.entries(snapshot.headers)) {
    if (key.toLowerCase() === 'content-length') {
      continue;
    }
    parts.push('-H', shellQuote(`${key}: ${value}`));
  }

  if (snapshot.body) {
    parts.push('--data', shellQuote(snapshot.body));
  }

  return parts.join(' ');
}

function buildFetchSnippet(snapshot: RequestSnapshot): string {
  const headers = JSON.stringify(snapshot.headers, null, 2);
  const body = snapshot.body ? `\n  body: ${JSON.stringify(snapshot.body)},` : '';

  return `await fetch(${JSON.stringify(snapshot.url)}, {
  method: ${JSON.stringify(snapshot.method)},
  headers: ${headers},${body}
});`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}