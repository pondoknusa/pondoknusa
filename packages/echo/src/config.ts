import type { EchoDriver, EchoOptions } from './types.js';

const ECHO_CONFIG_SCRIPT_ID = 'tyr-echo-config';

export interface EchoClientManifestConfig {
  broadcaster: EchoDriver;
  host?: string;
  path?: string;
  authEndpoint?: string;
}

interface EchoConfigDocument {
  getElementById(id: string): { textContent: string | null } | null;
}

interface EchoConfigRoot {
  ownerDocument?: EchoConfigDocument | null;
  getElementById?(id: string): { textContent: string | null } | null;
}

function resolveEchoConfigDocument(root: EchoConfigRoot): EchoConfigDocument | undefined {
  if (typeof root.getElementById === 'function') {
    return {
      getElementById: (id: string) => root.getElementById!(id),
    };
  }

  return root.ownerDocument ?? undefined;
}

export function readEchoConfigFromDocument(
  root?: EchoConfigRoot,
): EchoOptions | undefined {
  const resolved =
    root ?? (typeof document !== 'undefined' ? (document as EchoConfigRoot) : undefined);
  if (!resolved) {
    return undefined;
  }

  const script = resolveEchoConfigDocument(resolved)?.getElementById(ECHO_CONFIG_SCRIPT_ID);
  if (!script?.textContent?.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(script.textContent) as EchoClientManifestConfig;
    if (!parsed?.broadcaster || parsed.broadcaster === 'null') {
      return undefined;
    }

    return {
      broadcaster: parsed.broadcaster,
      host: parsed.host,
      path: parsed.path,
      authEndpoint: parsed.authEndpoint ?? '/broadcasting/auth',
    };
  } catch {
    return undefined;
  }
}

export { ECHO_CONFIG_SCRIPT_ID };