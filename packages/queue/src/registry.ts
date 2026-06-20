import { Job } from './job.js';

export type JobConstructor<T extends Job = Job> = new (
  data: Record<string, unknown>,
) => T;

export class JobNotFoundException extends Error {
  constructor(name: string) {
    super(`Job class not registered: ${name}`);
    this.name = 'JobNotFoundException';
  }
}

export class JobRegistry {
  private readonly jobs = new Map<string, JobConstructor>();

  register<TData extends Record<string, unknown>, TJob extends Job<TData>>(
    constructor: new (data: TData) => TJob,
  ): this {
    this.jobs.set(constructor.name, constructor as unknown as JobConstructor);
    return this;
  }

  has(name: string): boolean {
    return this.jobs.has(name);
  }

  create(name: string, data: Record<string, unknown>): Job {
    const constructor = this.jobs.get(name);
    if (!constructor) {
      throw new JobNotFoundException(name);
    }
    return new constructor(data);
  }
}