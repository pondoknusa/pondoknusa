import type { AdminResource } from './admin-resource.js';

export class AdminRegistry {
  private readonly resources = new Map<string, AdminResource>();

  register(resource: AdminResource): this {
    this.resources.set(resource.key, resource);
    return this;
  }

  all(): AdminResource[] {
    return [...this.resources.values()].sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }

  get(key: string): AdminResource | undefined {
    return this.resources.get(key);
  }

  has(key: string): boolean {
    return this.resources.has(key);
  }
}