import { mkdir, readFile, writeFile as fsWriteFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  buildCapabilityManifest,
  defaultRulesOutputPath,
  discoverDocs,
  discoverModels,
  flattenConfigKeys,
  renderAgentRules,
  type AppMcpContext,
} from '@pondoknusa/mcp';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { optionFlag, parseOptions, pathExists, projectPath } from '../utils.js';

const MCP_JSON = `{
  "mcpServers": {
    "pondoknusa": {
      "command": "npx",
      "args": ["pondoknusa", "mcp:serve"]
    }
  }
}
`;

export class McpInstallCommand extends Command {
  override readonly name = 'mcp:install';
  override readonly description =
    'Wire Cursor MCP + agent rules so coding tools understand Pondoknusa';
  override readonly usage = 'pondoknusa mcp:install [--force]';

  async handle(args: string[]): Promise<number> {
    const options = parseOptions(args);
    const force = optionFlag(options, 'force');
    const root = await requireProjectRoot();

    const mcpJsonPath = projectPath(root, '.cursor/mcp.json');
    const cursorRulesPath = projectPath(root, defaultRulesOutputPath('cursor'));
    const agentsPath = projectPath(root, defaultRulesOutputPath('agents'));

    if (!force) {
      if (await pathExists(mcpJsonPath)) {
        console.log('.cursor/mcp.json already exists (pass --force to overwrite).');
      }
      if (await pathExists(cursorRulesPath) && (await pathExists(agentsPath))) {
        console.log('Agent rules already present (pass --force to overwrite).');
      }
    }

    if (force || !(await pathExists(mcpJsonPath))) {
      await mkdir(dirname(mcpJsonPath), { recursive: true });
      await fsWriteFile(mcpJsonPath, MCP_JSON, 'utf8');
      console.log('Wrote .cursor/mcp.json');
    }

    const context = await buildInstallContext(root);
    const projectName = context.manifest.name;

    if (force || !(await pathExists(cursorRulesPath))) {
      await mkdir(dirname(cursorRulesPath), { recursive: true });
      await fsWriteFile(
        cursorRulesPath,
        renderAgentRules(context, { format: 'cursor', projectName }),
        'utf8',
      );
      console.log(`Wrote ${defaultRulesOutputPath('cursor')}`);
    }

    if (force || !(await pathExists(agentsPath))) {
      await fsWriteFile(
        agentsPath,
        renderAgentRules(context, { format: 'agents', projectName }),
        'utf8',
      );
      console.log(`Wrote ${defaultRulesOutputPath('agents')}`);
    }

    await ensureMcpDependency(root);

    console.log('');
    console.log('MCP ready for coding agents.');
    console.log('  Restart Cursor (or reload MCP) to pick up .cursor/mcp.json');
    console.log('  Tools: pondoknusa.primer, pondoknusa.routes, pondoknusa.models, …');

    return 0;
  }
}

async function buildInstallContext(root: string): Promise<AppMcpContext> {
  try {
    const { loadConfig } = await import('@pondoknusa/config');
    const { ConfigRepository } = await import('@pondoknusa/config');
    const {
      Application,
      ConfigServiceProvider,
      setRouteApplication,
      ServiceProvider,
    } = await import('@pondoknusa/core');
    const { createKernel } = await import('../kernel.js');
    const { importAppServiceProvider } = await import('../project-bootstrap.js');
    const { importRoutes } = await import('./mcp-serve-shared.js');

    await loadConfig(root, { validate: false });

    const app = new Application(root);
    setRouteApplication(app);
    app.register(ConfigServiceProvider);

    const providerModule = await importAppServiceProvider(root);
    if (providerModule?.AppServiceProvider) {
      const Provider = providerModule.AppServiceProvider as new (
        application: InstanceType<typeof Application>,
      ) => InstanceType<typeof ServiceProvider>;
      app.register(Provider);
    }

    await app.boot();
    const routesModule = await importRoutes(root);
    routesModule?.registerRoutes?.();

    const config = app.make<InstanceType<typeof ConfigRepository>>('config');
    return {
      manifest: buildCapabilityManifest({ name: config.get<string>('app.name') }),
      routes: app.router().listRoutes(),
      models: await discoverModels(root),
      configKeys: flattenConfigKeys(config.all()),
      commands: createKernel().list().map((command) => `pondoknusa ${command.name}`),
      docs: await discoverDocs(root),
    };
  } catch {
    const name = await readAppName(root);
    return {
      manifest: buildCapabilityManifest({ name }),
      routes: [],
      models: [],
      configKeys: [],
      commands: [
        'pondoknusa new',
        'pondoknusa dev',
        'pondoknusa migrate',
        'pondoknusa doctor',
        'pondoknusa mcp:serve',
        'pondoknusa mcp:install',
      ],
      docs: [],
    };
  }
}

async function readAppName(root: string): Promise<string> {
  try {
    const raw = await readFile(join(root, 'pondoknusa.json'), 'utf8');
    const parsed = JSON.parse(raw) as { name?: string };
    return parsed.name ?? 'pondoknusa';
  } catch {
    return 'pondoknusa';
  }
}

async function ensureMcpDependency(root: string): Promise<void> {
  const packagePath = projectPath(root, 'package.json');
  if (!(await pathExists(packagePath))) {
    return;
  }

  const raw = await readFile(packagePath, 'utf8');
  const pkg = JSON.parse(raw) as {
    dependencies?: Record<string, string>;
  };
  pkg.dependencies ??= {};
  if (pkg.dependencies['@pondoknusa/mcp']) {
    return;
  }

  const cliVersion = pkg.dependencies['@pondoknusa/cli'] ?? '^4.0.1';
  pkg.dependencies['@pondoknusa/mcp'] = cliVersion;
  await fsWriteFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  console.log('Added @pondoknusa/mcp to package.json dependencies');
}
