import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { McpTool } from './server.js';

function isMcpTool(value: unknown): value is McpTool {
  return Boolean(
    value
    && typeof value === 'object'
    && 'name' in value
    && 'handler' in value
    && typeof (value as McpTool).handler === 'function',
  );
}

export async function discoverMcpTools(basePath: string): Promise<McpTool[]> {
  const toolsDir = join(basePath, 'src/mcp/tools');
  let files: string[];

  try {
    files = await readdir(toolsDir);
  } catch {
    return [];
  }

  const tools: McpTool[] = [];
  for (const file of files) {
    if (!/\.(ts|js|mjs)$/.test(file)) {
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