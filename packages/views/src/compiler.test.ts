import { describe, expect, it } from 'vitest';
import { compile } from './compiler.js';

describe('compile', () => {
  it('parses layout, sections, echoes, and control flow', () => {
    const source = `@layout('layouts.app')

@section('title')
  Hello {{ name }}
@endsection

@if (show)
  <p>Visible</p>
@else
  <p>Hidden</p>
@endif

@foreach (users as user)
  <span>{{ user }}</span>
@endforeach
`;

    const template = compile(source);

    expect(template.layout).toBe('layouts.app');
    expect(template.ops.some((op) => op.type === 'section' && op.name === 'title')).toBe(
      true,
    );
    expect(template.ops.some((op) => op.type === 'if')).toBe(true);
    expect(template.ops.some((op) => op.type === 'foreach')).toBe(true);
  });

  it('parses include, component, and yield directives', () => {
    const source = `@yield('content', 'fallback')
@include('partials.header', { title: 'Home' })
@component('components.alert', { message: 'Hi' })
`;

    const template = compile(source);

    expect(template.ops).toEqual([
      { type: 'yield', name: 'content', defaultValue: 'fallback' },
      { type: 'include', name: 'partials.header', dataExpression: '{ title: \'Home\' }' },
      { type: 'component', name: 'components.alert', dataExpression: '{ message: \'Hi\' }' },
    ]);
  });
});