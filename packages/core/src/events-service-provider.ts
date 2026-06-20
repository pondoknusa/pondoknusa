import { ConfigRepository } from '@tyravel/config';
import {
  EventDispatcher,
  registerEventsConfig,
  type EventsConfig,
} from '@tyravel/events';
import { ServiceProvider } from './service-provider.js';

export class EventServiceProvider extends ServiceProvider {
  override register() {
    const dispatcher = new EventDispatcher({ container: this.app });
    this.app.instance('events', dispatcher);
    this.app.singleton(EventDispatcher, () => dispatcher);
  }

  override boot() {
    const config = this.app.make<ConfigRepository>('config');
    const eventsConfig = config.get<EventsConfig>('events', { listen: [] });
    const dispatcher = this.app.make<EventDispatcher>('events');

    registerEventsConfig(dispatcher, eventsConfig);
  }
}