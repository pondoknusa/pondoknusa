import { describe, expect, it } from 'vitest';
import { buildSsrDocument } from './ssr.js';
import { Response } from './response.js';

describe('buildSsrDocument', () => {
  it('wraps fragments in a full html document', () => {
    const html = buildSsrDocument('<main>Hello</main>', {
      title: 'Welcome',
      lang: 'en',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Welcome</title>');
    expect(html).toContain('<main>Hello</main>');
  });

  it('injects hydration manifest before </body> in full documents', () => {
    const html = buildSsrDocument(
      '<!DOCTYPE html><html><head></head><body><main>Hi</main></body></html>',
      {
        hydrationManifest: {
          islands: [{ id: 'counter', html: '<button>1</button>', props: { n: 1 } }],
        },
      },
    );

    expect(html).toContain('id="tyr-hydration"');
    expect(html).toContain('"counter"');
    expect(html.indexOf('tyr-hydration')).toBeLessThan(html.indexOf('</body>'));
  });

  it('injects head snippets before </head>', () => {
    const html = buildSsrDocument('<main>Hi</main>', {
      head: '<link rel="stylesheet" href="/app.css">',
    });

    expect(html).toContain('<link rel="stylesheet" href="/app.css">');
    expect(html.indexOf('/app.css')).toBeLessThan(html.indexOf('</head>'));
  });
});

describe('Response.ssr', () => {
  it('returns html with hydration manifest script', async () => {
    const response = Response.ssr('<main>Ready</main>', {
      title: 'SSR',
      hydrationManifest: {
        islands: [{ id: 'counter', html: '<span>0</span>', props: {} }],
      },
    });

    const body = await response.text();
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(body).toContain('id="tyr-hydration"');
    expect(body).toContain('<main>Ready</main>');
  });
});