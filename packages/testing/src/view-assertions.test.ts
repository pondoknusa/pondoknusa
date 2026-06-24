import { describe, expect, it } from 'vitest';
import { RenderedView, assertDontSee, assertSee } from './view-assertions.js';

describe('view assertions', () => {
  it('assertSee passes when text is present', () => {
    expect(() => assertSee('<h1>Hello Ada</h1>', 'Hello Ada')).not.toThrow();
  });

  it('assertSee fails when text is missing', () => {
    expect(() => assertSee('<h1>Hello</h1>', 'Goodbye')).toThrow(/contain/);
  });

  it('assertDontSee passes when text is absent', () => {
    expect(() => assertDontSee('<h1>Hello</h1>', 'Goodbye')).not.toThrow();
  });

  it('RenderedView chains assertions', () => {
    const view = new RenderedView('<main>Dashboard</main>');
    view.assertSee('Dashboard').assertDontSee('Sign in');
    expect(view.toString()).toContain('Dashboard');
  });

  it('assertHydrationManifest validates island props', () => {
    const view = new RenderedView('<main></main>', {
      islands: [{ id: 'counter', html: '<button>1</button>', props: { count: 1 } }],
    });

    view.assertHydrationManifest({
      islands: [{ id: 'counter', html: '', props: { count: 1 } }],
    });
  });
});