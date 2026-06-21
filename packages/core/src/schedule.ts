export type ScheduledCallback = () => void | Promise<void>;

export interface ScheduledEvent {
  expression: string;
  description: string;
  type: 'callback' | 'command';
  run?: ScheduledCallback;
  command?: string;
  commandArgs?: string[];
}

export class Schedule {
  private readonly events: ScheduledEvent[] = [];

  command(name: string, expression: string, args: string[] = []): this {
    this.events.push({
      expression,
      description: `command:${name}`,
      type: 'command',
      command: name,
      commandArgs: args,
    });
    return this;
  }

  call(callback: ScheduledCallback, expression: string, description = 'callback'): this {
    this.events.push({
      expression,
      description,
      type: 'callback',
      run: callback,
    });
    return this;
  }

  everyMinute(callback: ScheduledCallback, description = 'every minute'): this {
    return this.call(callback, '* * * * *', description);
  }

  hourly(callback: ScheduledCallback, description = 'hourly'): this {
    return this.call(callback, '0 * * * *', description);
  }

  daily(callback: ScheduledCallback, description = 'daily'): this {
    return this.call(callback, '0 0 * * *', description);
  }

  getEvents(): ScheduledEvent[] {
    return [...this.events];
  }

  getDueEvents(date = new Date()): ScheduledEvent[] {
    return this.events.filter((event) => cronMatches(event.expression, date));
  }
}

export function cronMatches(expression: string, date: Date): boolean {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return false;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  return (
    fieldMatches(minute!, date.getMinutes(), 0, 59) &&
    fieldMatches(hour!, date.getHours(), 0, 23) &&
    fieldMatches(dayOfMonth!, date.getDate(), 1, 31) &&
    fieldMatches(month!, date.getMonth() + 1, 1, 12) &&
    fieldMatches(dayOfWeek!, date.getDay(), 0, 6)
  );
}

function fieldMatches(field: string, value: number, min: number, max: number): boolean {
  if (field === '*') {
    return true;
  }

  return field.split(',').some((part) => partMatches(part.trim(), value, min, max));
}

function partMatches(part: string, value: number, min: number, max: number): boolean {
  if (part.includes('/')) {
    const [base, stepText] = part.split('/');
    const step = Number(stepText);
    if (!Number.isFinite(step) || step <= 0) {
      return false;
    }
    const start = base === '*' ? min : Number(base);
    return value >= start && (value - start) % step === 0;
  }

  if (part.includes('-')) {
    const [startText, endText] = part.split('-');
    const start = Number(startText);
    const end = Number(endText);
    return value >= start && value <= end;
  }

  return Number(part) === value;
}