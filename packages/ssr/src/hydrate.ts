import { asHydrationRoot, resolveHydrationDocument, type HydrationRoot } from './dom.js';
import { getIslandMount } from './island-registry.js';
import type { HydrateOptions, HydrateResult, HydrationManifestPayload } from './types.js';

const HYDRATION_SCRIPT_ID = 'tyr-hydration';

export function hydrate(options: HydrateOptions = {}): HydrateResult {
  const root = options.root ?? getDefaultRoot();
  const manifest = options.manifest ?? readManifestFromDocument(root);
  const skipped: string[] = [];
  const teardowns: Array<() => void> = [];
  let mounted = 0;

  const nodes = collectIslandNodes(root, manifest);

  for (const node of nodes) {
    const id = node.getAttribute('data-tyr-island');
    if (!id) {
      continue;
    }

    const mount = getIslandMount(id);
    if (!mount) {
      skipped.push(id);
      continue;
    }

    const props = parseIslandProps(node.getAttribute('data-tyr-props'));
    const island = manifest?.islands.find((entry) => entry.id === id);
    const teardown = mount({
      element: node,
      props,
      html: island?.html ?? node.innerHTML,
    });

    if (typeof teardown === 'function') {
      teardowns.push(teardown);
    }

    mounted += 1;
  }

  return { mounted, skipped, teardowns };
}

function getDefaultRoot(): HydrationRoot {
  if (typeof document === 'undefined') {
    throw new Error('hydrate() requires a DOM document. Pass options.root in non-browser environments.');
  }
  return asHydrationRoot(document);
}

function collectIslandNodes(
  root: HydrationRoot,
  manifest?: HydrationManifestPayload,
): HTMLElement[] {
  const nodes = new Map<string, HTMLElement>();

  for (const element of Array.from(root.querySelectorAll('[data-tyr-island]'))) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    const id = element.getAttribute('data-tyr-island');
    if (id) {
      nodes.set(id, element);
    }
  }

  const doc = resolveHydrationDocument(root);
  for (const island of manifest?.islands ?? []) {
    if (!nodes.has(island.id) && doc) {
      const byId = doc.getElementById(island.id);
      if (byId instanceof HTMLElement) {
        nodes.set(island.id, byId);
      }
    }
  }

  return [...nodes.values()];
}

export function readManifestFromDocument(
  root: HydrationRoot = getDefaultRoot(),
): HydrationManifestPayload | undefined {
  const doc = resolveHydrationDocument(root);
  const script = doc?.getElementById(HYDRATION_SCRIPT_ID);
  if (!(script instanceof HTMLScriptElement) || !script.textContent?.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(script.textContent) as HydrationManifestPayload;
    if (!parsed || !Array.isArray(parsed.islands)) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function parseIslandProps(raw: string | null): Record<string, unknown> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export { HYDRATION_SCRIPT_ID };