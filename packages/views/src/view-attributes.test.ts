import { describe, expect, it } from 'vitest';
import { ViewAttributeBag } from './view-attributes.js';

describe('ViewAttributeBag', () => {
  it('merges classes and styles with existing values', () => {
    const bag = new ViewAttributeBag({ class: 'btn', style: 'color: red' }).merge({
      class: 'btn-primary',
      style: 'font-weight: bold',
      id: 'save',
    });

    expect(bag.toHtml()).toBe(
      'class="btn btn-primary" style="color: red; font-weight: bold" id="save"',
    );
  });

  it('merges attributes onto the root element', () => {
    const bag = new ViewAttributeBag({ class: 'btn', type: 'button' });
    const html = bag.mergeIntoRootElement('<button class="base">Save</button>');

    expect(html).toBe('<button class="base" class="btn" type="button">Save</button>');
  });
});