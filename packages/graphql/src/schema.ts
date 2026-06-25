import type {
  GraphQLFieldDefinition,
  GraphQLSchemaDefinition,
  GraphQLTypeDefinition,
} from './types.js';

export class GraphQLSchema {
  readonly queryFields: Record<string, GraphQLFieldDefinition>;
  readonly mutationFields: Record<string, GraphQLFieldDefinition>;
  readonly types: Record<string, GraphQLTypeDefinition>;

  constructor(definition: GraphQLSchemaDefinition) {
    this.queryFields = definition.Query;
    this.mutationFields = definition.Mutation ?? {};
    this.types = definition.types ?? {};
  }

  rootFields(type: 'query' | 'mutation'): Record<string, GraphQLFieldDefinition> {
    return type === 'mutation' ? this.mutationFields : this.queryFields;
  }

  typeFields(typeName: string): Record<string, GraphQLFieldDefinition> | undefined {
    return this.types[typeName]?.fields;
  }
}

export function defineSchema(definition: GraphQLSchemaDefinition): GraphQLSchema {
  return new GraphQLSchema(definition);
}

export function defineType(fields: Record<string, GraphQLFieldDefinition>): GraphQLTypeDefinition {
  return { fields };
}