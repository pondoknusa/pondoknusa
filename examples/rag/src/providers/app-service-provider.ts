import { ServiceProvider } from '@tyravel/core';
import { JobRegistry } from '@tyravel/queue';
import { EmbedChunksJob } from '@tyravel/vector';

export class AppServiceProvider extends ServiceProvider {
  override register() {
    this.app.make<JobRegistry>('jobs.registry').register(EmbedChunksJob);
  }
}