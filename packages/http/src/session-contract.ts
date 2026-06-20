export interface SessionContract {
  readonly id: string;
  get<T = unknown>(key: string, fallback?: T): T | undefined;
  put(key: string, value: unknown): SessionContract;
  forget(key: string): SessionContract;
}