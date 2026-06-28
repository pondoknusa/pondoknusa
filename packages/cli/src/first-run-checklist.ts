import type { NewProjectOptions } from './new-project-options.js';

export function printFirstRunChecklist(
  name: string,
  options: NewProjectOptions,
  npmInstalled: boolean,
): void {
  console.log('');
  console.log('First-run checklist:');
  console.log('');
  console.log(`  cd ${name}`);

  if (!npmInstalled) {
    console.log('  npm install');
  }

  console.log('  tyravel migrate');
  console.log('  tyravel dev');

  console.log('  tyravel dev --queue     # web + queue worker together');
  console.log('  # or: npm run dev:worker in another terminal');

  console.log('  tyravel test');

  if (options.auth) {
    console.log('  tyravel auth:install    # guards, login routes, migrations');
  }

  console.log('  tyravel doctor          # verify environment before deploy');
  console.log('');
}