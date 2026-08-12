import { Command } from '../command.js';
import { installAuthScaffold } from '../auth-scaffold.js';
import { requireProjectRoot } from '../project.js';

export class AuthInstallCommand extends Command {
  override readonly name = 'auth:install';
  override readonly description =
    'Scaffold auth (session + API tokens, policies, password reset, OAuth)';
  override readonly usage = 'pondoknusa auth:install';

  async handle(): Promise<number> {
    const root = await requireProjectRoot();
    const result = await installAuthScaffold(root);

    if (!result.ok) {
      console.error(result.message);
      return 1;
    }

    return 0;
  }
}
