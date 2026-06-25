import type { GraphQLOperationDefinition } from './types.js';

export class GraphQLOperationRegistry {
  private readonly operations = new Map<string, GraphQLOperationDefinition>();

  register(operation: GraphQLOperationDefinition): this {
    this.operations.set(operation.name, operation);
    return this;
  }

  has(name: string): boolean {
    return this.operations.has(name);
  }

  get(name: string): GraphQLOperationDefinition | undefined {
    return this.operations.get(name);
  }

  list(): GraphQLOperationDefinition[] {
    return [...this.operations.values()];
  }
}

export function createOperationRegistry(
  operations: GraphQLOperationDefinition[] = [],
): GraphQLOperationRegistry {
  const registry = new GraphQLOperationRegistry();
  for (const operation of operations) {
    registry.register(operation);
  }
  return registry;
}