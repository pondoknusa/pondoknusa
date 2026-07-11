import type { ViewEngine } from '@pondoknusa/views';
import { REUSABLE_COMPONENTS_VIEWS_PATH } from './views-path.js';

export const REUSABLE_COMPONENT_NAMESPACE = 'ui';

export const REUSABLE_COMPONENTS: readonly string[] = [
  'alert',
  'avatar',
  'badge',
  'button',
  'card',
  'checkbox',
  'empty-state',
  'field',
  'icon',
  'input',
  'label',
  'modal',
  'pagination',
  'panel',
  'select',
  'spinner',
  'stat',
  'table',
  'textarea',
] as const;

export interface RegisterReusableComponentsOptions {
  namespace?: string;
}

export function registerReusableComponents(
  engine: ViewEngine,
  options: RegisterReusableComponentsOptions = {},
): string {
  const namespace = options.namespace ?? REUSABLE_COMPONENT_NAMESPACE;
  engine.namespace(namespace, REUSABLE_COMPONENTS_VIEWS_PATH);
  return namespace;
}