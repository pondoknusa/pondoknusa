import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { mcpTool } from '../stubs.js';
import { parseOptions, positionalArgs, projectPath, toPascalCase, writeFile, pathExists } from '../utils.js';

export class MakeToolCommand extends Command {
  override readonly name = 'make:tool';
  override readonly description = 'Scaffold an MCP tool handler for @tyravel/mcp';
  override readonly usage = 'tyravel make:tool <Name>';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    const [rawName] = positionalArgs(args);

    if (!rawName) {
      console.error('Tool name is required.');
      console.error('Usage: tyravel make:tool <Name>');
      return 1;
    }

    const root = await requireProjectRoot();
    const name = toPascalCase(rawName);
    const fileName = `${name}Tool.ts`;
    const target = projectPath(root, 'src/mcp/tools', fileName);

    if (await pathExists(target)) {
      console.error(`Tool already exists: src/mcp/tools/${fileName}`);
      return 1;
    }

    await writeFile(target, mcpTool(name));
    console.log(`MCP tool created: src/mcp/tools/${fileName}`);
    console.log('Register it when starting TyravelMcpServer in your MCP entrypoint.');

    return 0;
  }
}