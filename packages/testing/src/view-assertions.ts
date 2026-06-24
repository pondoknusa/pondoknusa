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

  assertHydrationManifest(
    expected: HydrationManifestSnapshot | ((manifest: HydrationManifestSnapshot) => void),
  ): this {
    const manifest = this.hydration;
    if (!manifest) {
      throw new Error('Expected a hydration manifest but none was captured.');
    }

    if (typeof expected === 'function') {
      expected(manifest);
      return this;
    }

    expectManifestMatches(manifest, expected);
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

function expectManifestMatches(
  actual: HydrationManifestSnapshot,
  expected: HydrationManifestSnapshot,
): void {
  if (actual.islands.length !== expected.islands.length) {
    throw new Error(
      `Expected ${expected.islands.length} hydration island(s) but found ${actual.islands.length}.`,
    );
  }

  for (const island of expected.islands) {
    const match = actual.islands.find((entry) => entry.id === island.id);
    if (!match) {
      throw new Error(`Expected hydration manifest to include island: ${JSON.stringify(island.id)}`);
    }

    if (JSON.stringify(match.props) !== JSON.stringify(island.props)) {
      throw new Error(
        `Hydration props mismatch for island ${island.id}: expected ${JSON.stringify(island.props)} got ${JSON.stringify(match.props)}`,
      );
    }
  }
}