import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DebugClearCommand } from './debug-clear.js';
import { DebugInstallCommand } from './debug-install.js';

describe('DebugInstallCommand', () => {
  let tempDir = '';
  let previousCwd = '';

  afterEach(() => {
    if (previousCwd) {
      process.chdir(previousCwd);
      previousCwd = '';
    }
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  it('scaffolds debug config, provider, and patches main.ts', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'pondoknusa-debug-install-'));
    mkdirSync(join(tempDir, 'config'), { recursive: true });
    mkdirSync(join(tempDir, 'src/providers'), { recursive: true });
    writeFileSync(
      join(tempDir, 'pondoknusa.json'),
      JSON.stringify({ name: 'app', entry: 'src/main.ts' }),
    );
    writeFileSync(
      join(tempDir, 'src/main.ts'),
      `import { AppServiceProvider } from './providers/app-service-provider.js';

app.register(AppServiceProvider);
`,
    );

    previousCwd = process.cwd();
    process.chdir(tempDir);

    const command = new DebugInstallCommand();
    expect(await command.handle()).toBe(0);

    const config = readFileSync(join(tempDir, 'config/debug.ts'), 'utf8');
    expect(config).toContain("path: '/__debug'");
    expect(config).toContain('correlationsPath');
    expect(existsSync(join(tempDir, 'src/providers/debug-service-provider.ts'))).toBe(true);

    const main = readFileSync(join(tempDir, 'src/main.ts'), 'utf8');
    expect(main).toContain('DebugPanelServiceProvider');
    expect(main).toContain('registerLazy');

    expect(await command.handle()).toBe(1);
  });
});

describe('DebugClearCommand', () => {
  let tempDir = '';
  let previousCwd = '';

  afterEach(() => {
    if (previousCwd) {
      process.chdir(previousCwd);
      previousCwd = '';
    }
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  it('removes preferred and legacy debug persist files', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'pondoknusa-debug-clear-'));
    mkdirSync(join(tempDir, '.pondoknusa'), { recursive: true });
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'pondoknusa.json'),
      JSON.stringify({ name: 'app', entry: 'src/main.ts' }),
    );
    writeFileSync(join(tempDir, 'src/main.ts'), 'export {};\n');
    writeFileSync(join(tempDir, '.pondoknusa/debug-entries.json'), '[]');
    writeFileSync(join(tempDir, '.pondoknusa/debug-correlations.json'), '[]');
    writeFileSync(join(tempDir, 'debug-entries.json'), '[]');

    previousCwd = process.cwd();
    process.chdir(tempDir);

    const command = new DebugClearCommand();
    expect(await command.handle()).toBe(0);

    expect(existsSync(join(tempDir, '.pondoknusa/debug-entries.json'))).toBe(false);
    expect(existsSync(join(tempDir, '.pondoknusa/debug-correlations.json'))).toBe(false);
    expect(existsSync(join(tempDir, 'debug-entries.json'))).toBe(false);
  });
});
