import { describe, expect, it } from 'vitest';
import {
  mergeComponentProps,
  parseAwareExpression,
  parsePropsExpression,
  renderClassDirective,
  renderStyleDirective,
} from './component-helpers.js';

describe('component helpers', () => {
  it('parses @props array syntax with defaults', () => {
    expect(parsePropsExpression("['title', 'count' => 0, 'active' => false]")).toEqual({
      title: undefined,
      count: 0,
      active: false,
    });
  });

  it('parses @props object syntax', () => {
    expect(parsePropsExpression('{ title: null, count: 2 }')).toEqual({
      title: null,
      count: 2,
    });
  });

  it('parses @aware arrays', () => {
    expect(parseAwareExpression("['color', 'size']")).toEqual(['color', 'size']);
  });

  it('splits declared props from attribute bag values', () => {
    expect(
      mergeComponentProps(
        { title: 'Default', count: 0 },
        { title: 'Hello', class: 'btn', 'data-id': 1 },
        true,
      ),
    ).toEqual({
      props: { title: 'Hello', count: 0 },
      attributes: { class: 'btn', 'data-id': 1 },
    });

    expect(
      mergeComponentProps(undefined, { title: 'Hello', class: 'btn' }, false),
    ).toEqual({
      props: { title: 'Hello', class: 'btn' },
      attributes: {},
    });
  });

  it('renders conditional class and style directives', () => {
    expect(
      renderClassDirective({
        'font-bold': true,
        hidden: false,
        'text-gray': true,
      }),
    ).toBe('class="font-bold text-gray"');

    expect(
      renderStyleDirective({
        color: 'red',
        display: false,
      }),
    ).toBe('style="color: red"');
  });
});