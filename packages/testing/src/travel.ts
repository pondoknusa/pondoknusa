import { vi } from 'vitest';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

export function freezeTime(at: Date | string | number = new Date()): void {
  vi.useFakeTimers();
  vi.setSystemTime(at);
}

export function back(): void {
  vi.useRealTimers();
}

export function travel(amount: number) {
  return {
    days: () => {
      vi.advanceTimersByTime(amount * DAY_MS);
      return controls;
    },
    hours: () => {
      vi.advanceTimersByTime(amount * HOUR_MS);
      return controls;
    },
    minutes: () => {
      vi.advanceTimersByTime(amount * MINUTE_MS);
      return controls;
    },
  };
}

const controls = {
  back,
  travel,
};