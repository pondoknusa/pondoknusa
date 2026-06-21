import { describe, expect, it } from 'vitest';
import {
  Str,
  camelCase,
  kebabCase,
  random,
  slug,
  snakeCase,
  studlyCase,
  title,
} from './str.js';

describe('Str', () => {
  it('slugifies titles for Lontar-style routes', () => {
    expect(slug('  Hello World!  ')).toBe('hello-world');
    expect(slug('My Cool Post Title')).toBe('my-cool-post-title');
    expect(slug('already-a-slug')).toBe('already-a-slug');
    expect(slug('Mixed CASE And Symbols!!!')).toBe('mixed-case-and-symbols');
    expect(slug('underscores_are_fine')).toBe('underscores-are-fine');
    expect(Str.slug('Custom Separator', '_')).toBe('custom_separator');
  });

  it('converts values to snake, camel, kebab, and studly case', () => {
    expect(snakeCase('FooBar')).toBe('foo_bar');
    expect(snakeCase('foo-bar baz')).toBe('foo_bar_baz');
    expect(camelCase('foo-bar')).toBe('fooBar');
    expect(camelCase('foo_bar_baz')).toBe('fooBarBaz');
    expect(kebabCase('FooBarBaz')).toBe('foo-bar-baz');
    expect(studlyCase('foo-bar')).toBe('FooBar');
    expect(Str.camel('hello_world')).toBe('helloWorld');
  });

  it('title-cases and changes string casing', () => {
    expect(title('hello world')).toBe('Hello World');
    expect(title('HELLO-WORLD')).toBe('Hello World');
    expect(Str.lower('ABC')).toBe('abc');
    expect(Str.upper('abc')).toBe('ABC');
  });

  it('generates random alphanumeric strings', () => {
    const value = random(32);
    expect(value).toHaveLength(32);
    expect(value).toMatch(/^[A-Za-z0-9]+$/);
    expect(random(0)).toBe('');
    expect(Str.random(8)).toHaveLength(8);
  });
});