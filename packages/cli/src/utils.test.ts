import { describe, expect, it } from 'vitest';
import { toKebabCase, toPascalCase } from './utils.js';

describe('name helpers', () => {
  it('converts values to PascalCase', () => {
    expect(toPascalCase('user_profile')).toBe('UserProfile');
    expect(toPascalCase('post controller')).toBe('PostController');
  });

  it('converts values to kebab-case', () => {
    expect(toKebabCase('MyBlogApp')).toBe('my-blog-app');
    expect(toKebabCase('hello_world')).toBe('hello-world');
  });
});