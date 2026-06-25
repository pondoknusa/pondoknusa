import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig } from '@tyravel/config';
import { ConfigRepository } from '@tyravel/config';
import {
  Application,
  ConfigServiceProvider,
  setRouteApplication,
  ServiceProvider,
} from '@tyravel/core';
import {
  buildCapabilityManifest,
  discoverDocs,
  discoverModels,
  flattenConfigKeys,
  TyravelMcpServer,
  type AppMcpContext,
  type McpTool,
} from '@tyravel/mcp';
import { createKernel } from '../kernel.js';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { importAppServiceProvider } from '../project-bootstrap.js';
import { parseOptions, positionalArgs } from '../utils.js';
import { importRoutes } from './mcp-serve-shared.js';

export class McpServeCommand extends Command {
  override readonly name = 'mcp:serve';
  override readonly description = 'Run the Tyravel MCP server over stdio for agents';
  override readonly usage = 'tyravel mcp:serve';

  async handle(args: string[]): Promise<number> {
    parseOptions(args);
    positionalArgs(args);

    const root = await requireProjectRoot();
    await loadConfig(root);

    const app = new Application(root);
    setRouteApplication(app);
    app.register(ConfigServiceProvider);

    const providerModule = await importAppServiceProvider(root);
    if (providerModule?.AppServiceProvider) {
      const Provider = providerModule.AppServiceProvider as new (
        application: Application,
      ) => ServiceProvider;
      app.register(Provider);
    }

    await app.boot();

    const routesModule = await importRoutes(root);
    routesModule?.registerRoutes?.();

    const config = app.make<ConfigRepository>('config');
    const context: AppMcpContext = {
      manifest: buildCapabilityManifest({ name: config.get<string>('app.name') }),
      routes: app.router().listRoutes(),
      models: await discoverModels(root),
      configKeys: flattenConfigKeys(config.all()),
      commands: createKernel()
        .list()
        .map((command) => `tyravel ${command.name}`),
      docs: await discoverDocs(root),
      getConfig(key: string) {
        return config.has(key) ? config.get(key) : undefined;
      },
    };

    const appTools = await loadAppTools(root);
    const server = TyravelMcpServer.fromApp(context, appTools);
    await server.runStdio();

    return 0;
  }
}

async function loadAppTools(root: string): Promise<McpTool[]> {
  const toolsDir = join(root, 'src/mcp/tools');
  let files: string[];
  try {
    const { readdir } = await import('node:fs/promises');
    files = await readdir(toolsDir);
  } catch {
    return [];
  }

  const tools: McpTool[] = [];
  for (const file of files) {
    if (!/\.(ts|js)$/.test(file)) {
      continue;
    }

    const module = await import(pathToFileURL(join(toolsDir, file)).href) as Record<string, unknown>;
    for (const exported of Object.values(module)) {
      if (isMcpTool(exported)) {
        tools.push(exported);
      }
    }
  }

  return tools;
}

function isMcpTool(value: unknown): value is McpTool {
  return Boolean(
    value
    && typeof value === 'object'
    && 'name' in value
    && 'handler' in value
    && typeof (value as McpTool).handler === 'function',
  );
}