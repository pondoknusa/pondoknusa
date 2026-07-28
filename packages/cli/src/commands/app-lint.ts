import { lintApplication, lintHasErrors, type LintIssue } from '@pondoknusa/lint';
import { Command } from '../command.js';
import { requireProjectRoot } from '../project.js';
import { parseOptions, positionalArgs } from '../utils.js';

export class AppLintCommand extends Command {
  override readonly name = 'app:lint';
  override readonly description =
    'Lint routes, auth, and CSRF (static + in-process request probes)';
  override readonly usage = 'pondoknusa app:lint [--strict] [--static-only]';

  async handle(args: string[]): Promise<number> {
    const options = parseOptions(args);
    positionalArgs(args);

    const root = await requireProjectRoot();
    const { issues, runtime } = await lintApplication(root, {
      strict: options.strict === true ? true : undefined,
      runtime: options['static-only'] === true ? false : true,
    });

    if (issues.length === 0) {
      console.log(
        runtime
          ? 'No lint issues found (static + CSRF request probes).'
          : 'No lint issues found (static only).',
      );
      return 0;
    }

    const errors = issues.filter((issue) => issue.severity === 'error');
    const warnings = issues.filter((issue) => issue.severity === 'warning');

    for (const issue of errors) {
      printIssue(issue);
    }
    for (const issue of warnings) {
      printIssue(issue);
    }

    const summary = [
      errors.length > 0 ? `${errors.length} error(s)` : null,
      warnings.length > 0 ? `${warnings.length} warning(s)` : null,
    ]
      .filter(Boolean)
      .join(', ');

    console.error(`Found ${summary}.`);
    return lintHasErrors(issues) ? 1 : 0;
  }
}

function printIssue(issue: LintIssue): void {
  const location =
    issue.file !== undefined
      ? issue.line !== undefined
        ? issue.column !== undefined
          ? `${issue.file}:${issue.line}:${issue.column}`
          : `${issue.file}:${issue.line}`
        : issue.file
      : '';
  const label = issue.severity === 'error' ? 'error' : 'warning';
  const where = location ? ` ${location}` : '';
  console.error(`[${label}] [${issue.rule}]${where} ${issue.message}`);
}
