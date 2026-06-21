export type ValidationErrors = Record<string, string[]>;

export class ViewErrorBag {
  constructor(private readonly errors: ValidationErrors = {}) {}

  any(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  has(field: string): boolean {
    return Object.hasOwn(this.errors, field);
  }

  first(field: string): string | undefined {
    return this.errors[field]?.[0];
  }

  get(field: string): string[] {
    return this.errors[field] ?? [];
  }

  all(): ValidationErrors {
    return { ...this.errors };
  }
}