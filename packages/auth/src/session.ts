export interface SessionStore {
  read(id: string): Promise<Record<string, unknown>>;
  write(id: string, data: Record<string, unknown>, lifetimeMinutes: number): Promise<void>;
  destroy(id: string): Promise<void>;
}

export class Session {
  private dirty = false;

  constructor(
    public readonly id: string,
    private data: Record<string, unknown>,
  ) {}

  get<T = unknown>(key: string, fallback?: T): T | undefined {
    const value = this.data[key];
    return (value === undefined ? fallback : value) as T | undefined;
  }

  put(key: string, value: unknown): this {
    this.data[key] = value;
    this.dirty = true;
    return this;
  }

  forget(key: string): this {
    delete this.data[key];
    this.dirty = true;
    return this;
  }

  all(): Record<string, unknown> {
    return { ...this.data };
  }

  isDirty(): boolean {
    return this.dirty;
  }

  markClean(): void {
    this.dirty = false;
  }
}