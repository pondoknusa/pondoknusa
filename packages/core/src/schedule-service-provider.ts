import { Schedule } from './schedule.js';
import { ServiceProvider } from './service-provider.js';

export class ScheduleServiceProvider extends ServiceProvider {
  override register() {
    const schedule = new Schedule();
    this.app.instance('schedule', schedule);
    this.app.singleton(Schedule, () => schedule);
  }
}