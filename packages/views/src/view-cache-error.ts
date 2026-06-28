import { docsLink } from '@tyravel/support';

export class CompiledViewCacheMissError extends Error {
  constructor(
    readonly viewName: string,
    readonly cacheDirectory: string,
  ) {
    super(
      `Compiled view cache is cold for [${viewName}]. Run \`tyravel view:cache\` to warm ${cacheDirectory} before serving in production. See ${docsLink('/guide/deployment')}.`,
    );
    this.name = 'CompiledViewCacheMissError';
  }
}