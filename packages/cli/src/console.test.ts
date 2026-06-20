import { describe, expect, it } from 'vitest';
import { ConsoleKernel, parseArgv } from './console.js';
import { VersionCommand } from './commands/version.js';

describe('parseArgv', () => {
  it('parses command and positional arguments', () => {
    expect(parseArgv(['new', 'blog'])).toEqual({
      command: 'new',
      args: ['blog'],
      options: {},
    });
  });

  it('parses long and short options', () => {
    expect(parseArgv(['serve', '--port', '4000', '-h', '0.0.0.0'])).toEqual({
      command: 'serve',
      args: [],
      options: {
        port: '4000',
        h: '0.0.0.0',
      },
    });
  });

  it('parses boolean flags', () => {
    expect(parseArgv(['new', 'blog', '--force'])).toEqual({
      command: 'new',
      args: ['blog'],
      options: { force: true },
    });
  });
});

describe('ConsoleKernel', () => {
  it('returns a non-zero exit code for unknown commands', async () => {
    const kernel = new ConsoleKernel([new VersionCommand()]);
    const code = await kernel.run(['missing-command']);
    expect(code).toBe(1);
  });

  it('runs registered commands', async () => {
    const kernel = new ConsoleKernel([new VersionCommand()]);
    const code = await kernel.run(['version']);
    expect(code).toBe(0);
  });
});