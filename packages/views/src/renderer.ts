import { escapeHtml } from './escape.js';
import { evaluateExpression, parseForeachExpression } from './evaluate.js';
import type { TemplateOp, ViewContext } from './types.js';
import type { ViewEngine } from './view-engine.js';
import { ViewHelpers } from './view-helpers.js';

export async function renderOps(
  ops: TemplateOp[],
  context: ViewContext,
  helpers: ViewHelpers,
  engine: ViewEngine,
): Promise<void> {
  for (const op of ops) {
    switch (op.type) {
      case 'text':
        helpers.append(op.value);
        break;

      case 'echo': {
        const value = evaluateExpression(op.expression, context);
        helpers.append(op.raw ? String(value ?? '') : escapeHtml(value));
        break;
      }

      case 'if': {
        const result = Boolean(evaluateExpression(op.expression, context));
        if (result) {
          await renderOps(op.body, context, helpers, engine);
        } else if (op.elseBody) {
          await renderOps(op.elseBody, context, helpers, engine);
        }
        break;
      }

      case 'foreach': {
        const parsed = parseForeachExpression(op.expression);
        if (!parsed) {
          break;
        }

        const items = evaluateExpression(parsed.itemsExpression, context);
        if (!items || typeof items !== 'object') {
          break;
        }

        const iterable = Array.isArray(items)
          ? items.entries()
          : Object.entries(items as Record<string, unknown>);

        for (const [key, value] of iterable) {
          const loopContext: ViewContext = {
            ...context,
            [parsed.valueName]: value,
          };

          if (parsed.keyName) {
            loopContext[parsed.keyName] = key;
          }

          await renderOps(op.body, loopContext, helpers, engine);
        }
        break;
      }

      case 'section': {
        const sectionHelpers = new ViewHelpers();
        await renderOps(op.body, context, sectionHelpers, engine);
        helpers.setSection(op.name, sectionHelpers.toString());
        break;
      }

      case 'yield':
        helpers.append(helpers.yield(op.name, op.defaultValue ?? ''));
        break;

      case 'include':
      case 'component': {
        const data = op.dataExpression
          ? (evaluateExpression(op.dataExpression, context) as ViewContext)
          : context;
        const html = await engine.render(op.name, data, helpers.getSections());
        helpers.append(html);
        break;
      }
    }
  }
}