export abstract class Job<TData extends Record<string, unknown> = Record<string, unknown>> {
  constructor(public readonly data: TData) {}

  abstract handle(): void | Promise<void>;

  jobName(): string {
    return this.constructor.name;
  }

  displayName(): string {
    return this.jobName();
  }
}