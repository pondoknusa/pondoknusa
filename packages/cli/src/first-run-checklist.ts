import type { NewProjectOptions } from './new-project-options.js';

export function printFirstRunChecklist(
  name: string,
  options: NewProjectOptions,
  state: {
    npmInstalled: boolean;
    authInstalled: boolean;
    migrated: boolean;
    mcpInstalled: boolean;
  },
): void {
  console.log('');
  console.log('Ready to breathe:');
  console.log('');
  console.log(`  cd ${name}`);

  if (!state.npmInstalled) {
    console.log('  npm install');
  }

  if (options.database !== 'sqlite' && !state.migrated) {
    console.log('  # configure DB_* in .env, then:');
    console.log('  pondoknusa migrate');
  }

  console.log('  pondoknusa dev');

  if (options.headless) {
    console.log('  curl http://127.0.0.1:3000/api/v1/health');
  }

  if (state.mcpInstalled) {
    console.log('');
    console.log('  MCP for coding agents is wired (.cursor/mcp.json + AGENTS.md).');
    console.log('  Reload Cursor MCP, then ask agents to use pondoknusa.primer.');
  } else {
    console.log('  pondoknusa mcp:install   # Cursor MCP + agent rules');
  }

  if (options.auth && !state.authInstalled) {
    console.log('  pondoknusa auth:install');
  }

  console.log('');
}
