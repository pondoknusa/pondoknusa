import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createViewWatcher } from '@tyravel/views';
import { Command } from '../command.js';
import { loadProjectConfig, requireProjectRoot } from '../project.js';
import {
  optionNumber,
  optionString,
  parseOptions,
  positionalArgs,
} from '../utils.js';
import { createViewEngine, loadViewConfig } from '../view-config.js';

export class ServeCommand extends Command {
  override readonly name = 'serve';
  override readonly description = 'Start the development server';
  override readonly usage = 'tyravel serve [--port=<port>] [--host=<hostname>]';

  async handle(args: string[]): Promise<number> {
    const options = parseOptions(args);
    positionalArgs(args);

    const root = requireProjectRoot();
    const config = loadProjectConfig(root);
    const entry = join(root, config.entry);

    if (!existsSync(entry)) {
      console.error(`Entry file not found: ${config.entry}`);
      return 1;
    }

    const port = optionNumber(options, 'port', config.serve.port);
    const hostname = optionString(options, 'host', config.serve.hostname) ?? config.serve.hostname;
    const runtime = detectRuntime();

    if (!runtime) {
      console.error('No supported TypeScript runtime found. Install Bun or use Node 20+.');
      return 1;
    }

    console.log(`Starting Tyravel server using ${runtime.name}...`);

    const viewConfig = await loadViewConfig(root);
    const viewEngine = createViewEngine(root, {
      ...viewConfig,
      compiled: true,
      compiledPath: viewConfig.compiledPath ?? 'storage/framework/views',
    });
    const viewWatcher = createViewWatcher(viewEngine, {
      onRecompiled: (viewName) => {
        console.log(`[views] Recompiled ${viewName}`);
      },
      onError: (error) => {
        console.error(`[views] ${error.message}`);
      },
    });

    const child = spawn(
      runtime.command,
      runtime.args(entry, port, hostname),
      {
        cwd: root,
        stdio: 'inherit',
        env: {
          ...process.env,
          TYRAVEL_PORT: String(port),
          TYRAVEL_HOST: hostname,
        },
      },
    );

    return await new Promise<number>((resolve) => {
      const shutdown = (code: number): void => {
        viewWatcher.close();
        resolve(code);
      };

      child.on('exit', (code) => shutdown(code ?? 1));
      child.on('error', (error) => {
        console.error(error.message);
        shutdown(1);
      });
    });
  }
}

interface Runtime {
  name: string;
  command: string;
  args: (entry: string, port: number, hostname: string) => string[];
}

function detectRuntime(): Runtime | undefined {
  if (process.versions.bun) {
    return {
      name: 'Bun',
      command: process.execPath,
      args: (entry) => ['run', entry],
    };
  }

  if (commandExists('bun')) {
    return {
      name: 'Bun',
      command: 'bun',
      args: (entry) => ['run', entry],
    };
  }

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor >= 22) {
    return {
      name: 'Node',
      command: process.execPath,
      args: (entry) => ['--experimental-strip-types', entry],
    };
  }

  return undefined;
}

function commandExists(command: string): boolean {
  const which = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(which, [command], { stdio: 'ignore' });
  return result.status === 0;
}