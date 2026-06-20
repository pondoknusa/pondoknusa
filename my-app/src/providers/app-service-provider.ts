import { ServiceProvider } from '@tyravel/core';

export class AppServiceProvider extends ServiceProvider {
  override register() {
    this.app.instance('app.name', 'Tyravel');
  }
}
