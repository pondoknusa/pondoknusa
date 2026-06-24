export interface HydrationRoot {
  querySelectorAll(selectors: string): ArrayLike<Element>;
  ownerDocument?: HydrationDocument | null;
  getElementById?(id: string): Element | null;
}

export interface HydrationDocument {
  getElementById(id: string): Element | null;
}

export function asHydrationRoot(root: unknown): HydrationRoot {
  if (!root || typeof root !== 'object' || !('querySelectorAll' in root)) {
    throw new Error('hydrate() root must support querySelectorAll().');
  }
  return root as HydrationRoot;
}

export function resolveHydrationDocument(root: HydrationRoot): HydrationDocument | undefined {
  if (typeof root.getElementById === 'function') {
    return {
      getElementById: (id: string) => root.getElementById!(id),
    };
  }
  return root.ownerDocument ?? undefined;
}