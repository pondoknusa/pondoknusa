export interface CommandDefinition {
  name: string;
  description: string;
  usage?: string;
}

export abstract class Command {
  abstract readonly name: string;
  abstract readonly description: string;
  readonly usage?: string;

  abstract handle(args: string[]): Promise<number>;

  definition(): CommandDefinition {
    return {
      name: this.name,
      description: this.description,
      usage: this.usage,
    };
  }
}