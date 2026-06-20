
export function projectVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
`;
}

export function featureTestStub(className: string): string {
  return `import { describe, it } from 'vitest';
import { Application } from '@tyravel/core';
import { TestCase, withTyravelTest } from '@tyravel/testing';
import '../src/routes/web.js';

class ${className} extends TestCase {
  protected createApplication() {
    return new Application(import.meta.dir + '/..');
  }
}

const t = withTyravelTest(${className});

describe('feature / example', () => {
  it('responds on the home route', async () => {
    const response = await t.http.get('http://localhost/');
    await response.assertOk();
  });
});
`;
}