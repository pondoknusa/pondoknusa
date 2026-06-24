import type { EchoClientConfig } from './echo-types.js';
import { renderViteTags, type ViteManifest } from './vite-helpers.js';

export const ECHO_CONFIG_SCRIPT_ID = 'tyr-echo-config';

export function renderEchoBootstrap(
  config: EchoClientConfig | null,
  manifest: ViteManifest,
  entry: string,
  base = '/build',
): string {
  if (!config) {
    return '';
  }

  const encoded = JSON.stringify(config).replace(/</g, '\\u003c');
  const configScript =
    `<script type="application/json" id="${ECHO_CONFIG_SCRIPT_ID}">${encoded}</script>`;
  const viteTags = renderViteTags(manifest, entry, base);

  return viteTags ? `${configScript}\n${viteTags}` : configScript;
}