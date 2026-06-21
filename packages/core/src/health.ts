export type HealthCheck = () => boolean | Promise<boolean>;

export interface HealthCheckResult {
  ok: boolean;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'fail';
  checks: Record<string, HealthCheckResult>;
}

export class HealthChecker {
  private readonly checks = new Map<string, HealthCheck>();

  register(name: string, check: HealthCheck): this {
    this.checks.set(name, check);
    return this;
  }

  async run(): Promise<HealthReport> {
    const checks: Record<string, HealthCheckResult> = {};

    for (const [name, check] of this.checks.entries()) {
      try {
        const ok = await check();
        checks[name] = ok ? { ok: true } : { ok: false, error: 'Check returned false' };
      } catch (error) {
        checks[name] = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    const status = Object.values(checks).every((result) => result.ok) ? 'ok' : 'fail';
    return { status, checks };
  }
}