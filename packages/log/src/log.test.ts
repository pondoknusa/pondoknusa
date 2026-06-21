import { afterEach, describe, expect, it, vi } from 'vitest';
import { LogManager, LogRepository, StdoutChannel } from './index.js';

describe('StdoutChannel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes structured json to stdout', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const channel = new StdoutChannel();

    channel.info('hello', { userId: 1 });

    expect(spy).toHaveBeenCalledOnce();
    const line = spy.mock.calls[0]?.[0];
    expect(typeof line).toBe('string');
    const parsed = JSON.parse(line as string) as {
      level: string;
      message: string;
      context?: Record<string, unknown>;
    };
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.context).toEqual({ userId: 1 });
  });
});

describe('StackChannel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards logs to every channel in the stack', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const manager = new LogManager({
      default: 'stack',
      channels: {
        stdout: { channel: 'stdout' },
        stack: { channel: 'stack', channels: ['stdout', 'stdout'] },
      },
    });
    const log = new LogRepository(manager, 'stack');

    log.info('forwarded');
    log.warn('caution', { code: 'WARN' });

    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(2);

    const warnLine = warnSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(warnLine as string) as {
      level: string;
      message: string;
      context?: Record<string, unknown>;
    };
    expect(parsed.level).toBe('warn');
    expect(parsed.message).toBe('caution');
    expect(parsed.context).toEqual({ code: 'WARN' });
  });
});