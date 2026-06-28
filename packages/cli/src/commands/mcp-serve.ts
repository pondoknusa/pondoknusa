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
} from '@tyravel/mcp';
import { createKernel } from '../kernel.js';
import { McpToolsServiceProvider, resolveMcpTools } from '../mcp-tools-provider.js';
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
    app.registerLazy(McpToolsServiceProvider, {
      commands: ['mcp:serve', 'mcp:export-rules'],
      bindings: ['mcp.tools'],
    });

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

    const appTools = await resolveMcpTools(app);
    const server = TyravelMcpServer.fromApp(context, appTools);
    await server.runStdio();

    return 0;
  }
}

