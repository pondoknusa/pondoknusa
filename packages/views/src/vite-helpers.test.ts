import { describe, expect, it } from 'vitest';
import { renderViteTags } from './vite-helpers.js';

describe('vite helpers', () => {
  it('renders css and js tags from a manifest entry', () => {
    const html = renderViteTags(
      {
        'resources/js/app.ts': {
          file: 'assets/app.js',
          css: ['assets/app.css'],
        },
      },
      'resources/js/app.ts',
      '/build',
    );

    expect(html).toContain('<link rel="stylesheet" href="/build/assets/app.css">');
    expect(html).toContain('<link rel="modulepreload" href="/build/assets/app.js">');
    expect(html).toContain('<script type="module" src="/build/assets/app.js"></script>');
  });

  it('preloads imported chunks from the manifest', () => {
    const html = renderViteTags(
      {
        'resources/js/app.ts': {
          file: 'assets/app.js',
          imports: ['resources/js/vendor.ts'],
        },
        'resources/js/vendor.ts': {
          file: 'assets/vendor.js',
        },
      },
      'resources/js/app.ts',
      '/build',
    );

    expect(html).toContain('<link rel="modulepreload" href="/build/assets/vendor.js">');
    expect(html).toContain('<link rel="modulepreload" href="/build/assets/app.js">');
  });
});