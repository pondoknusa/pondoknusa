import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ViewEngine } from '@pondoknusa/views';
import {
  REUSABLE_COMPONENTS,
  REUSABLE_COMPONENTS_VIEWS_PATH,
  registerReusableComponents,
} from './index.js';

let counter = 0;

function createEngine(): { engine: ViewEngine; basePath: string } {
  const basePath = mkdtempSync(join(tmpdir(), 'pondoknusa-ui-'));
  mkdirSync(join(basePath, 'resources/views'), { recursive: true });
  const engine = new ViewEngine(basePath, { path: 'resources/views', extension: '.tyr' });
  registerReusableComponents(engine);
  return { engine, basePath };
}

async function renderComponent(
  name: string,
  props: Record<string, unknown>,
  slotBody = '',
): Promise<string> {
  const { engine, basePath } = createEngine();
  const view = `view-${counter++}`;
  const call =
    slotBody.length > 0
      ? `@component('ui::components.${name}', ${JSON.stringify(props)})
${slotBody}
@endcomponent`
      : `@component('ui::components.${name}', ${JSON.stringify(props)})`;
  writeFileSync(join(basePath, `resources/views/${view}.tyr`), call);
  return engine.render(view, {});
}

describe('@pondoknusa/reusable-components', () => {
  it('exposes the reusable components namespace path', () => {
    expect(REUSABLE_COMPONENTS_VIEWS_PATH).toContain('resources');
  });

  it('registers the ui namespace and ships every component', async () => {
    const { engine } = createEngine();
    const catalog = await engine.getComponentCatalog();
    const names = catalog.map((entry) => entry.name);
    for (const name of REUSABLE_COMPONENTS) {
      expect(names).toContain(`ui::${name}`);
    }
  });

  it('renders the button component with variant and size classes', async () => {
    const html = await renderComponent('button', { label: 'Save', variant: 'danger' });
    expect(html).toContain('ui-btn--danger');
    expect(html).toContain('ui-btn--md');
    expect(html).toContain('Save');
    expect(html).toContain('<button');
  });

  it('renders the button as a link when href is provided', async () => {
    const html = await renderComponent('button', { label: 'Go', href: '/home' });
    expect(html).toContain('<a');
    expect(html).toContain('href="/home"');
  });

  it('renders the alert component defaulting to the info variant', async () => {
    const html = await renderComponent('alert', {}, 'Heads up!');
    expect(html).toContain('ui-alert--info');
    expect(html).toContain('Heads up!');
  });

  it('renders the alert title when provided', async () => {
    const html = await renderComponent('alert', { title: 'Warning', variant: 'warning' });
    expect(html).toContain('ui-alert--warning');
    expect(html).toContain('ui-alert__title">Warning');
  });

  it('renders the card component with a default slot and footer override', async () => {
    const html = await renderComponent(
      'card',
      { title: 'Featured' },
      `<p>Body copy</p>
@slot('footer')
  <a href="/posts/1">Read more</a>
@endslot`,
    );
    expect(html).toContain('ui-card__header">Featured');
    expect(html).toContain('<p>Body copy</p>');
    expect(html).toContain('Read more');
    expect(html).toContain('ui-card__footer');
  });

  it('omits the card footer when none is provided', async () => {
    const html = await renderComponent('card', { title: 'Notes' }, '<p>No footer here</p>');
    expect(html).not.toContain('ui-card__footer');
  });

  it('renders the input component with value and placeholder', async () => {
    const html = await renderComponent('input', {
      name: 'email',
      value: 'ada@example.com',
      placeholder: 'Enter email',
    });
    expect(html).toContain('name="email"');
    expect(html).toContain('value="ada@example.com"');
    expect(html).toContain('placeholder="Enter email"');
  });

  it('renders the select component and marks the selected option', async () => {
    const html = await renderComponent('select', {
      name: 'role',
      value: '2',
      options: [
        { value: '1', label: 'Admin' },
        { value: '2', label: 'Editor' },
      ],
    });
    expect(html).toContain('<option value="1" >Admin</option>');
    expect(html).toContain('<option value="2" selected>Editor</option>');
  });

  it('renders the table empty state', async () => {
    const html = await renderComponent('table', { columns: ['Name', 'Email'], rows: [] });
    expect(html).toContain('No records found.');
    expect(html).toContain('colspan="2"');
  });

  it('renders the table rows', async () => {
    const html = await renderComponent('table', {
      columns: ['Name'],
      rows: [{ Name: 'Ada' }],
    });
    expect(html).toContain('<td>Ada</td>');
  });

  it('renders the pagination component', async () => {
    const html = await renderComponent('pagination', { current: 2, pages: [1, 2, 3] });
    expect(html).toContain('rel="prev"');
    expect(html).toContain('rel="next"');
    expect(html).toContain('ui-pagination__link--current">2</span>');
  });

  it('renders the badge component with tone', async () => {
    const html = await renderComponent('badge', { label: 'New', tone: 'success' });
    expect(html).toContain('ui-badge--success');
    expect(html).toContain('New');
  });

  it('renders the spinner component small size', async () => {
    const html = await renderComponent('spinner', { size: 'sm' });
    expect(html).toContain('ui-spinner--sm');
  });

  it('renders the avatar with initials when no src', async () => {
    const html = await renderComponent('avatar', { initials: 'AB', size: 48 });
    expect(html).toContain('ui-avatar--initials');
    expect(html).toContain('>AB</span>');
  });

  it('renders the checkbox with checked state', async () => {
    const html = await renderComponent('checkbox', { name: 'agree', label: 'Agree', checked: true });
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
    expect(html).toContain('Agree');
  });

  it('renders the field component with an error', async () => {
    const html = await renderComponent('field', { name: 'email', label: 'Email', error: 'Required' }, '<input />');
    expect(html).toContain('ui-field--error');
    expect(html).toContain('ui-field__error">Required');
  });

  it('renders the stat component', async () => {
    const html = await renderComponent('stat', { label: 'Revenue', value: '$1,200' });
    expect(html).toContain('ui-stat__label">Revenue');
    expect(html).toContain('ui-stat__value">$1,200');
  });
});