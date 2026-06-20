import { ConfigRepository } from '@tyravel/config';
import { ViewEngine, type ViewConfig } from '@tyravel/views';
import { ServiceProvider } from './service-provider.js';

const DEFAULT_VIEW_CONFIG: ViewConfig = {
  path: 'resources/views',
  extension: '.tyr',
};

export class ViewServiceProvider extends ServiceProvider {
  override register() {
    const config = this.app.make<ConfigRepository>('config');
    const viewConfig = config.get<ViewConfig>('views') ?? DEFAULT_VIEW_CONFIG;
    const engine = new ViewEngine(this.app.basePath, viewConfig);

    this.app.instance('view', engine);
    this.app.singleton(ViewEngine, () => engine);
  }
}