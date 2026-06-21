import { describe, expect, it } from 'vitest';
import { cronMatches, Schedule } from './schedule.js';

describe('Schedule', () => {
  it('matches common cron expressions', () => {
    const everyMinute = new Date('2026-06-21T12:34:00Z');
    expect(cronMatches('* * * * *', everyMinute)).toBe(true);

    const hourlyHit = new Date('2026-06-21T12:00:00Z');
    const hourlyMiss = new Date('2026-06-21T12:30:00Z');
    expect(cronMatches('0 * * * *', hourlyHit)).toBe(true);
    expect(cronMatches('0 * * * *', hourlyMiss)).toBe(false);

    const dailyHit = new Date();
    dailyHit.setHours(0, 0, 0, 0);
    expect(cronMatches('0 0 * * *', dailyHit)).toBe(true);
  });

  it('returns due events for the current minute', async () => {
    const schedule = new Schedule();
    const runs: string[] = [];

    schedule.call(() => {
      runs.push('every-minute');
    }, '* * * * *');

    schedule.call(() => {
      runs.push('hourly');
    }, '0 * * * *');

    const due = schedule.getDueEvents(new Date('2026-06-21T14:00:00Z'));
    expect(due).toHaveLength(2);

    for (const event of due) {
      await event.run?.();
    }

    expect(runs).toEqual(['every-minute', 'hourly']);
  });
});