export interface HydrationManifestSnapshot {
  islands: Array<{ id: string; html: string; props: Record<string, unknown> }>;
}

export class RenderedView {
  constructor(
    private readonly html: string,
    private readonly hydration?: HydrationManifestSnapshot,
  ) {}

  getHydrationManifest(): HydrationManifestSnapshot | undefined {
    return this.hydration;
  }

  assertIsland(id: string): this {
    const manifest = this.hydration;
    if (!manifest?.islands.some((island) => island.id === id)) {
      throw new Error(`Expected hydration manifest to include island: ${JSON.stringify(id)}`);
    }
    return this;
  }

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