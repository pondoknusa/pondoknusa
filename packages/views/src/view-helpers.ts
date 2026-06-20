export class ViewHelpers {
  private readonly sections = new Map<string, string>();
  private output = '';

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

  getSections(): ReadonlyMap<string, string> {
    return this.sections;
  }

  toString(): string {
    return this.output;
  }
}