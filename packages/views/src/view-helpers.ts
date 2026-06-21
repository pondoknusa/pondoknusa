export class ViewHelpers {
  private readonly sections = new Map<string, string>();
  private output = '';

  constructor(private readonly stacks: Map<string, string[]> = new Map()) {}

  append(value: string): void {
    this.output += value;
  }

  setSection(name: string, content: string): void {
    this.sections.set(name, content);
  }

  importSections(sections: ReadonlyMap<string, string>): void {
    for (const [name, content] of sections) {
      this.sections.set(name, content);
    }
  }

  yield(name: string, defaultValue = ''): string {
    return this.sections.get(name) ?? defaultValue;
  }

  pushStack(name: string, content: string): void {
    const entries = this.stacks.get(name) ?? [];
    entries.push(content);
    this.stacks.set(name, entries);
  }

  renderStack(name: string, defaultValue = ''): string {
    const entries = this.stacks.get(name);
    if (!entries || entries.length === 0) {
      return defaultValue;
    }
    return entries.join('\n');
  }

  getSections(): ReadonlyMap<string, string> {
    return this.sections;
  }

  getStacks(): Map<string, string[]> {
    return this.stacks;
  }

  toString(): string {
    return this.output;
  }
}