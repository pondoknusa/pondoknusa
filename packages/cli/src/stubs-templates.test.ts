import { describe, expect, it } from 'vitest';
import { parseProjectTemplate, webRoutesForTemplate } from './stubs-templates.js';

describe('project templates', () => {
  it('parses supported template names', () => {
    expect(parseProjectTemplate('api')).toBe('api');
    expect(parseProjectTemplate(undefined)).toBe('default');
  });

  it('rejects unknown templates', () => {
    expect(() => parseProjectTemplate('blog')).toThrow(/Unsupported template/);
  });

  it('generates API routes for the api template', () => {
    const routes = webRoutesForTemplate('api');
    expect(routes).toContain("Route.prefix('api')");
    expect(routes).toContain('/posts');
  });
});