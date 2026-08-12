import { describe, expect, it } from 'vitest';
import { createFrameworkTools } from './framework-tools.js';
import { frameworkPrimerMarkdown } from './framework-primer.js';
import { buildCapabilityManifest } from './manifest.js';
import { renderAgentRules } from './export-rules.js';

describe('framework primer', () => {
  it('documents layout and workflow', () => {
    const markdown = frameworkPrimerMarkdown();
    expect(markdown).toContain('src/main.ts');
    expect(markdown).toContain('pondoknusa doctor');
    expect(markdown).toContain('pondoknusa.primer');
  });

  it('is exposed as pondoknusa.primer MCP tool', async () => {
    const tools = createFrameworkTools({
      manifest: buildCapabilityManifest({ name: 'demo' }),
      routes: [],
      models: [],
      configKeys: [],
      commands: [],
      docs: [],
    });
    const primer = tools.find((tool) => tool.name === 'pondoknusa.primer');
    expect(primer).toBeDefined();
    const result = (await primer!.handler({})) as { markdown: string };
    expect(result.markdown).toContain('How Pondoknusa works');
  });

  it('is embedded in exported agent rules', () => {
    const rules = renderAgentRules(
      {
        manifest: buildCapabilityManifest({ name: 'demo' }),
        routes: [],
        models: [],
        configKeys: [],
        commands: [],
        docs: [],
      },
      { format: 'agents', projectName: 'demo' },
    );
    expect(rules).toContain('How Pondoknusa works');
    expect(rules).toContain('AGENTS.md');
  });
});
