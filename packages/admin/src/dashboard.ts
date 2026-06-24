export interface AdminDashboardStats {
  healthStatus: 'ok' | 'fail' | 'unknown';
  healthChecks: Record<string, { ok: boolean; error?: string }>;
  failedJobs: number | null;
  queueDepth: number | null;
  resources: Array<{ key: string; label: string; count: number | null }>;
}

export interface AdminDashboardDependencies {
  runHealth?: () => Promise<{
    status: 'ok' | 'fail';
    checks: Record<string, { ok: boolean; error?: string }>;
  }>;
  countFailedJobs?: () => Promise<number>;
  countQueueDepth?: () => Promise<number>;
  countResource?: (key: string) => Promise<number | null>;
}

export async function buildDashboardStats(
  resources: Array<{ key: string; label: string; model: { query: () => { count: () => Promise<number> } } }>,
  deps: AdminDashboardDependencies = {},
): Promise<AdminDashboardStats> {
  let healthStatus: AdminDashboardStats['healthStatus'] = 'unknown';
  let healthChecks: AdminDashboardStats['healthChecks'] = {};

  if (deps.runHealth) {
    const report = await deps.runHealth();
    healthStatus = report.status;
    healthChecks = report.checks;
  }

  const failedJobs = deps.countFailedJobs ? await deps.countFailedJobs() : null;
  const queueDepth = deps.countQueueDepth ? await deps.countQueueDepth() : null;
  const resourceStats = await Promise.all(
    resources.map(async (resource) => ({
      key: resource.key,
      label: resource.label,
      count: deps.countResource
        ? await deps.countResource(resource.key)
        : await resource.model.query().count().catch(() => null),
    })),
  );

  return {
    healthStatus,
    healthChecks,
    failedJobs,
    queueDepth,
    resources: resourceStats,
  };
}