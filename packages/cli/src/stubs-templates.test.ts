import { describe, expect, it } from 'vitest';
import { applyTemplateDefaults, parseProjectTemplate, webRoutesForTemplate } from './stubs-templates.js';
import type { NewProjectOptions } from './new-project-options.js';

describe('project templates', () => {
  it('parses supported template names', () => {
    expect(parseProjectTemplate('api')).toBe('api');
    expect(parseProjectTemplate('headless')).toBe('headless');
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

  it('applies headless defaults', () => {
    const base: NewProjectOptions = {
      database: 'sqlite',
      redis: false,
      auth: true,
      queue: 'database',
      mail: 'log',
      ai: true,
      template: 'headless',
      headless: false,
    };

    const result = applyTemplateDefaults('headless', base);
    expect(result.headless).toBe(true);
    expect(result.ai).toBe(false);
    expect(result.auth).toBe(true);
  });
});