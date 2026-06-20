import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from './compiler.js';
import { renderOps } from './renderer.js';
import type { CompiledTemplate, ViewConfig, ViewContext } from './types.js';
import { ViewHelpers } from './view-helpers.js';

interface CacheEntry {
  mtimeMs: number;
  template: CompiledTemplate;
}

export class ViewEngine {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly extension: string;

  constructor(
    private readonly basePath: string,
    private readonly config: ViewConfig,
  ) {
    this.extension = config.extension ?? '.tyr';
  }

  async render(
    name: string,
    context: ViewContext = {},
    parentSections?: ReadonlyMap<string, string>,
  ): Promise<string> {
    const template = this.loadTemplate(name);
    const helpers = new ViewHelpers();

    if (parentSections) {
      helpers.importSections(parentSections);
    }

    await renderOps(template.ops, context, helpers, this);

    if (template.layout) {
      const layoutHelpers = new ViewHelpers();
      layoutHelpers.importSections(helpers.getSections());
      await renderOps(
        this.loadTemplate(template.layout).ops,
        context,
        layoutHelpers,
        this,
      );
      return layoutHelpers.toString();
    }

    return helpers.toString();
  }

  exists(name: string): boolean {
    try {
      this.resolvePath(name);
      return true;
    } catch {
      return false;
    }
  }

  private loadTemplate(name: string): CompiledTemplate {
    const path = this.resolvePath(name);
    const stats = statSync(path);
    const cached = this.cache.get(path);

    if (cached && cached.mtimeMs === stats.mtimeMs) {
      return cached.template;
    }

    const source = readFileSync(path, 'utf8');
    const template = compile(source);
    this.cache.set(path, { mtimeMs: stats.mtimeMs, template });
    return template;
  }

  private resolvePath(name: string): string {
    const relative = name.replace(/\./g, '/');
    return join(this.basePath, this.config.path, `${relative}${this.extension}`);
  }
}