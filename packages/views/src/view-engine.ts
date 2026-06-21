import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  cacheFileForView,
  clearCompiledCacheDir,
  discoverViewNames,
  readCompiledCache,
  writeCompiledCache,
} from './compiled-cache.js';
import { compile, type CompileOptions } from './compiler.js';
import { mergeEvaluationContext } from './evaluate.js';
import { renderOps } from './renderer.js';
import type { CompiledTemplate, ViewConfig, ViewContext } from './types.js';
import {
  ViewRegistry,
  type CustomDirectiveHandler,
  type ViewAuthBindings,
  type ViewComposerHandler,
  type ViewExpressionBindings,
  type ViewFormBindings,
} from './view-registry.js';
import { ViewHelpers } from './view-helpers.js';

interface CacheEntry {
  mtimeMs: number;
  registryVersion: number;
  template: CompiledTemplate;
}

const DEFAULT_COMPILED_PATH = 'storage/framework/views';

export class ViewEngine {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly extension: string;
  private readonly registry = new ViewRegistry();
  private readonly viewsRoot: string;
  private compiledCacheDirectory?: string;

  constructor(
    private readonly basePath: string,
    private readonly config: ViewConfig,
  ) {
    this.extension = config.extension ?? '.tyr';
    this.viewsRoot = join(this.basePath, this.config.path);

    if (config.compiled) {
      this.compiledCacheDirectory = join(
        this.basePath,
        config.compiledPath ?? DEFAULT_COMPILED_PATH,
      );
    }
  }

  directive(name: string, handler: CustomDirectiveHandler): this {
    this.registry.directive(name, handler);
    this.cache.clear();
    return this;
  }

  composer(pattern: string, handler: ViewComposerHandler): this {
    this.registry.composer(pattern, handler);
    return this;
  }

  share(data: ViewContext): this {
    this.registry.share(data);
    return this;
  }

  setBindings(bindings: ViewExpressionBindings): this {
    this.registry.setBindings(bindings);
    return this;
  }

  setAuth(auth: ViewAuthBindings | undefined): this {
    this.registry.setAuth(auth);
    return this;
  }

  setForm(form: ViewFormBindings | undefined): this {
    this.registry.setForm(form);
    return this;
  }

  setCompiledCachePath(path: string | null): this {
    this.compiledCacheDirectory = path ?? undefined;
    return this;
  }

  getRegistry(): ViewRegistry {
    return this.registry;
  }

  buildEvaluationContext(context: ViewContext): ViewContext {
    return mergeEvaluationContext(context, this.registry.getBindings());
  }

  resolveName(name: string): string {
    if (this.existsAt(name)) {
      return name;
    }

    const anonymous = `components.${name}`;
    if (this.existsAt(anonymous)) {
      return anonymous;
    }

    return name;
  }

  async render(
    name: string,
    context: ViewContext = {},
    parentSections?: ReadonlyMap<string, string>,
    parentStacks?: Map<string, string[]>,
    parentOnceRendered?: Set<string>,
  ): Promise<string> {
    const template = this.loadTemplate(name);
    const composed = await this.registry.applyComposers(name, context);
    const renderContext = this.buildEvaluationContext(this.mergeFormContext(composed));
    const helpers = new ViewHelpers(parentStacks, parentOnceRendered);

    if (parentSections) {
      helpers.importSections(parentSections);
    }

    await renderOps(template.ops, renderContext, helpers, this);

    if (template.layout) {
      const layoutHelpers = new ViewHelpers(
        helpers.getStacks(),
        helpers.getOnceRendered(),
      );
      layoutHelpers.importSections(helpers.getSections());
      await renderOps(
        this.loadTemplate(template.layout).ops,
        renderContext,
        layoutHelpers,
        this,
      );
      return layoutHelpers.toString();
    }

    return helpers.toString();
  }

  exists(name: string): boolean {
    return this.existsAt(name) || this.existsAt(`components.${name}`);
  }

  async warmCompiledCache(): Promise<number> {
    if (!this.compiledCacheDirectory) {
      throw new Error('Compiled view cache is disabled for this engine.');
    }

    let warmed = 0;
    for (const name of this.listViewNames()) {
      this.loadTemplate(name);
      warmed += 1;
    }
    return warmed;
  }

  clearCompiledCache(): number {
    if (!this.compiledCacheDirectory) {
      return 0;
    }

    this.cache.clear();
    return clearCompiledCacheDir(this.compiledCacheDirectory);
  }

  listViewNames(): string[] {
    return discoverViewNames(this.viewsRoot, this.extension);
  }

  private existsAt(name: string): boolean {
    try {
      statSync(this.resolvePath(name));
      return true;
    } catch {
      return false;
    }
  }

  private loadTemplate(name: string): CompiledTemplate {
    const path = this.resolvePath(name);
    const stats = statSync(path);
    const registryVersion = this.registry.getCompileVersion();
    const cached = this.cache.get(path);

    if (
      cached &&
      cached.mtimeMs === stats.mtimeMs &&
      cached.registryVersion === registryVersion
    ) {
      return cached.template;
    }

    const compileOptions: CompileOptions = {
      customDirectives: this.registry.getDirectiveNames(),
    };

    if (this.compiledCacheDirectory) {
      const cacheFile = cacheFileForView(this.compiledCacheDirectory, this.viewsRoot, path);
      const diskEntry = readCompiledCache(cacheFile);
      if (
        diskEntry &&
        diskEntry.mtimeMs === stats.mtimeMs &&
        diskEntry.registryVersion === registryVersion
      ) {
        this.cache.set(path, {
          mtimeMs: stats.mtimeMs,
          registryVersion,
          template: diskEntry.template,
        });
        return diskEntry.template;
      }

      const source = readFileSync(path, 'utf8');
      const template = compile(source, compileOptions);
      const memoryEntry = { mtimeMs: stats.mtimeMs, registryVersion, template };
      this.cache.set(path, memoryEntry);
      writeCompiledCache(cacheFile, memoryEntry);
      return template;
    }

    const source = readFileSync(path, 'utf8');
    const template = compile(source, compileOptions);
    this.cache.set(path, { mtimeMs: stats.mtimeMs, registryVersion, template });
    return template;
  }

  private mergeFormContext(context: ViewContext): ViewContext {
    const form = this.registry.getForm();
    if (!form) {
      return context;
    }

    return {
      ...context,
      $errors: form.errors(),
    };
  }

  private resolvePath(name: string): string {
    const relative = name.replace(/\./g, '/');
    return join(this.viewsRoot, `${relative}${this.extension}`);
  }
}