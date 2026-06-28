import { join } from 'node:path';
import type { ChildProcess } from 'node:child_process';
import { loadProjectConfig } from './project.js';
import {
  describeRuntimeIssue,
  detectTypeScriptRuntime,
  printRuntimeInfo,
  spawnTypeScriptEntry,
} from './runtime.js';
import { optionNumber, optionString } from './utils.js';

export interface DevServerOptions {
  root: string;
  cliArgs: string[];
  options: Record<string, string | boolean>;
}

export async function startDevServer({
  root,
  cliArgs,
  options,
}: DevServerOptions): Promise<{ code: number; children: ChildProcess[] }> {
  const config = await loadProjectConfig(root);
  const entry = join(root, config.entry);
  const runtime = detectTypeScriptRuntime();

  if (!runtime) {
    console.error(describeRuntimeIssue());
    return { code: 1, children: [] };
  }

  const port = optionNumber(options, 'port', config.serve.port);
  const hostname = optionString(options, 'host', config.serve.hostname) ?? config.serve.hostname;
  const children: ChildProcess[] = [];

  console.log('Starting Tyravel development server...');
  printRuntimeInfo(runtime);
  console.log(`URL: http://${hostname === '0.0.0.0' ? '127.0.0.1' : hostname}:${port}`);
  console.log('');
  console.log('Dev tips:');
  console.log('  • Views, config, and routes hot-reload in this process');
  console.log('  • Run `tyravel debug:watch` in another terminal after `tyravel debug:install`');
  console.log('  • Run `tyravel queue:work` when testing queued mail or jobs');
  console.log('');

  const server = spawnTypeScriptEntry({
    entry,
    cwd: root,
    env: {
      ...process.env,
      TYRAVEL_PORT: String(port),
      TYRAVEL_HOST: hostname,
      TYRAVEL_VIEW_WATCH: '1',
      TYRAVEL_HOT_RELOAD: '1',
    },
  });
  children.push(server);

  const shutdown = (): void => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const code = await new Promise<number>((resolve) => {
    server.on('exit', (exitCode) => {
      process.off('SIGINT', shutdown);
      process.off('SIGTERM', shutdown);
      resolve(exitCode ?? 1);
    });
    server.on('error', (error) => {
      console.error(error.message);
      resolve(1);
    });
  });

  return { code, children };
}