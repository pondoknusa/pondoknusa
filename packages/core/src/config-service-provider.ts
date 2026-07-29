import {
  ConfigRepository,
  getCachedConfig,
  loadProjectEnv,
  resolveConfigForBoot,
  type ConfigBootResult,
} from '@pondoknusa/config';
import { ServiceProvider } from './service-provider.js';

export class ConfigServiceProvider extends ServiceProvider {
  override async register() {
    await loadProjectEnv(this.app.basePath);
    const embedded = getCachedConfig();
    const boot: ConfigBootResult = embedded
      ? {
          loaded: true,
          config: embedded,
          message: 'Loaded config embedded at build time',
        }
      : await resolveConfigForBoot(this.app.basePath);
    const repository = new ConfigRepository(boot.config);

    this.app.instance('config', repository);
    this.app.singleton(ConfigRepository, () => repository);
    this.app.instance('pondoknusa.configCache', {
      loaded: boot.loaded,
      message: boot.message,
    });
  }
}