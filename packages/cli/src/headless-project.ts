import { loadConfig } from '@tyravel/config';
import { loadProjectConfig } from './project.js';

export async function isHeadlessProject(root: string): Promise<boolean> {
  try {
    const project = await loadProjectConfig(root);
    if (project.mode === 'headless') {
      return true;
    }
  } catch {
    // Fall through to config check.
  }

  try {
    const config = await loadConfig(root, { validate: false }) as {
      app?: { headless?: boolean };
    };
    return config.app?.headless === true;
  } catch {
    return false;
  }
}