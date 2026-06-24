// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { getIslandMount, clearIslands } from './island-registry.js';
import { registerProgrammaticIsland } from './programmatic-island.js';

describe('registerProgrammaticIsland', () => {
  it('registers mount functions exported from programmatic views', () => {
    clearIslands();

    let mounted = false;
    registerProgrammaticIsland('counter', {
      mount: () => {
        mounted = true;
      },
    });

    const mount = getIslandMount('counter');
    mount?.({
      element: document.createElement('div'),
      props: {},
      html: '<button>0</button>',
    });

    expect(mounted).toBe(true);
  });
});