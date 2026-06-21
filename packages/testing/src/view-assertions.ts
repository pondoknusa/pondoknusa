export class RenderedView {
  constructor(private readonly html: string) {}

  assertSee(text: string): this {
    assertSee(this.html, text);
    return this;
  }

  assertDontSee(text: string): this {
    assertDontSee(this.html, text);
    return this;
  }

  toString(): string {
    return this.html;
  }
}

export function assertSee(html: string, text: string): void {
  if (!html.includes(text)) {
    throw new Error(`Expected rendered HTML to contain: ${JSON.stringify(text)}`);
  }
}

export function assertDontSee(html: string, text: string): void {
  if (html.includes(text)) {
    throw new Error(`Expected rendered HTML not to contain: ${JSON.stringify(text)}`);
  }
}