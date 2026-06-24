// @vitest-environment happy-dom

import { Window } from 'happy-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { clearIslands, registerIsland } from './island-registry.js';
import { hydrate, readManifestFromDocument } from './hydrate.js';

describe('hydrate', () => {
  afterEach(() => {
    clearIslands();
  });

  it('reads hydration manifest from the document script tag', () => {
    const window = new Window();
    window.document.write(`
      <script type="application/json" id="tyr-hydration">
        {"islands":[{"id":"counter","html":"<button>1</button>","props":{"n":1}}]}
      </script>
    `);

    const manifest = readManifestFromDocument(window.document as unknown as import('./dom.js').HydrationRoot);
    expect(manifest?.islands).toHaveLength(1);
    expect(manifest?.islands[0]?.id).toBe('counter');
  });

  it('mounts registered islands from data-tyr-island markers', () => {
    const window = new Window();
    window.document.write(`
      <div data-tyr-island="counter" data-tyr-props="{&quot;count&quot;:2}">
        <button>2</button>
      </div>
    `);

    const mounted: string[] = [];
    registerIsland('counter', ({ element, props }) => {
      mounted.push(String(props.count));
      element.dataset.hydrated = 'yes';
    });

    const root = window.document as unknown as import('./dom.js').HydrationRoot;
    const result = hydrate({ root });

    expect(result.mounted).toBe(1);
    expect(result.skipped).toEqual([]);
    expect(mounted).toEqual(['2']);
    expect(window.document.querySelector('[data-tyr-island="counter"]')?.getAttribute('data-hydrated'))
      .toBe('yes');
  });

  it('skips islands without a registered mount function', () => {
    const window = new Window();
    window.document.write(`<div data-tyr-island="missing"></div>`);

    const root = window.document as unknown as import('./dom.js').HydrationRoot;
    const result = hydrate({ root });
    expect(result.mounted).toBe(0);
    expect(result.skipped).toEqual(['missing']);
  });
});