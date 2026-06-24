import type { ViewEngine } from '@tyravel/views';

export async function renderAdminView(
  view: ViewEngine,
  template: string,
  context: Record<string, unknown>,
): Promise<string> {
  return view.render(`admin::${template}`, context);
}