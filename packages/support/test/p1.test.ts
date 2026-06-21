import { describe, it, expect, afterEach } from 'vitest';
import { Conditionable } from '../src/conditionable.js';
import { Pipeline } from '../src/pipeline.js';
import { Stringable } from '../src/stringable.js';
import { Macroable } from '../src/macroable.js';

/* ──── Conditionable ────────────────────────────────────────────────── */

describe('Conditionable', () => {
  class TestClass extends Conditionable {
    constructor(public items: number[] = []) {
      super();
    }

    add(n: number): this {
      this.items.push(n);
      return this;
    }
  }

  it('when() applies callback on truthy', () => {
    const result = new TestClass([1]).when(true, (c) => c.add(2));
    expect(result.items).toEqual([1, 2]);
  });

  it('when() skips on falsy', () => {
    const result = new TestClass([1]).when(false, (c) => c.add(2));
    expect(result.items).toEqual([1]);
  });

  it('when() with fallback', () => {
    const result = new TestClass([1]).when(false, (c) => c.add(2), (c) => c.add(3));
    expect(result.items).toEqual([1, 3]);
  });

  it('when() with function condition', () => {
    const result = new TestClass([1, 2, 3]).when(
      (c) => c.items.length > 2,
      (c) => c.add(4),
    );
    expect(result.items).toEqual([1, 2, 3, 4]);
  });

  it('unless() applies callback on falsy', () => {
    const result = new TestClass([1]).unless(false, (c) => c.add(2));
    expect(result.items).toEqual([1, 2]);
  });

  it('unless() skips on truthy', () => {
    const result = new TestClass([1]).unless(true, (c) => c.add(2));
    expect(result.items).toEqual([1]);
  });
});

/* ──── Pipeline ─────────────────────────────────────────────────────── */

describe('Pipeline', () => {
  it('sends data through a series of pipes', () => {
    const result = new Pipeline<string>()
      .send('hello')
      .through([
        (passable, next) => next(passable + ' world'),
        (passable, next) => next(passable.toUpperCase()),
      ])
      .then((passable) => passable);
    expect(result).toBe('HELLO WORLD');
  });

  it('works with class-based pipes', () => {
    class UppercasePipe {
      handle(passable: string, next: (s: string) => string): string {
        return next(passable.toUpperCase());
      }
    }

    class ExclaimPipe {
      handle(passable: string, next: (s: string) => string): string {
        return next(passable + '!');
      }
    }

    const result = new Pipeline<string>()
      .send('hello')
      .through([new UppercasePipe(), new ExclaimPipe()])
      .thenReturn();
    expect(result).toBe('HELLO!');
  });

  it('supports custom via() method name', () => {
    class CustomPipe {
      process(passable: number, next: (n: number) => number): number {
        return next(passable * 2);
      }
    }

    const result = new Pipeline<number>()
      .send(5)
      .through([new CustomPipe()])
      .via('process')
      .thenReturn();
    expect(result).toBe(10);
  });

  it('then() with custom destination', () => {
    const result = new Pipeline<number>()
      .send(3)
      .through([
        (n, next) => next(n + 1),
      ])
      .then((n) => `Result: ${n}`);
    expect(result).toBe('Result: 4');
  });

  it('throws if send() was not called', () => {
    expect(() => new Pipeline().then((x) => x)).toThrow('Pipeline.send()');
  });

  it('handles empty pipes', () => {
    const result = new Pipeline<number>().send(42).thenReturn();
    expect(result).toBe(42);
  });
});

/* ──── Stringable ───────────────────────────────────────────────────── */

describe('Stringable', () => {
  it('creates via static of()', () => {
    expect(Stringable.of('hello').toString()).toBe('hello');
  });

  it('slug()', () => {
    expect(Stringable.of('Hello World').slug().toString()).toBe('hello-world');
  });

  it('title()', () => {
    expect(Stringable.of('hello world').title().toString()).toBe('Hello World');
  });

  it('camel()', () => {
    expect(Stringable.of('hello_world').camel().toString()).toBe('helloWorld');
  });

  it('kebab()', () => {
    expect(Stringable.of('helloWorld').kebab().toString()).toBe('hello-world');
  });

  it('snake()', () => {
    expect(Stringable.of('helloWorld').snake().toString()).toBe('hello_world');
  });

  it('studly()', () => {
    expect(Stringable.of('hello world').studly().toString()).toBe('HelloWorld');
  });

  it('upper() / lower()', () => {
    expect(Stringable.of('Hello').upper().toString()).toBe('HELLO');
    expect(Stringable.of('Hello').lower().toString()).toBe('hello');
  });

  it('ucfirst() / lcfirst()', () => {
    expect(Stringable.of('hello').ucfirst().toString()).toBe('Hello');
    expect(Stringable.of('Hello').lcfirst().toString()).toBe('hello');
  });

  it('append() / prepend()', () => {
    expect(Stringable.of('world').append('!', '!').toString()).toBe('world!!');
    expect(Stringable.of('world').prepend('hello ').toString()).toBe('hello world');
  });

  it('after() / before()', () => {
    expect(Stringable.of('hello@world').after('@').toString()).toBe('world');
    expect(Stringable.of('hello@world').before('@').toString()).toBe('hello');
  });

  it('replace()', () => {
    expect(Stringable.of('hello world').replace('world', 'there').toString()).toBe('hello there');
  });

  it('replaceFirst() / replaceLast()', () => {
    expect(Stringable.of('a-b-a').replaceFirst('a', 'x').toString()).toBe('x-b-a');
    expect(Stringable.of('a-b-a').replaceLast('a', 'x').toString()).toBe('a-b-x');
  });

  it('contains() / startsWith() / endsWith()', () => {
    expect(Stringable.of('hello world').contains('world')).toBe(true);
    expect(Stringable.of('hello world').contains('xyz')).toBe(false);
    expect(Stringable.of('hello world').startsWith('hello')).toBe(true);
    expect(Stringable.of('hello world').endsWith('world')).toBe(true);
  });

  it('is() with wildcard', () => {
    expect(Stringable.of('hello.txt').is('*.txt')).toBe(true);
    expect(Stringable.of('hello.txt').is('*.md')).toBe(false);
  });

  it('limit() / words()', () => {
    expect(Stringable.of('hello world').limit(5).toString()).toBe('hello...');
    expect(Stringable.of('hello world').words(1).toString()).toBe('hello...');
  });

  it('finish() / start()', () => {
    expect(Stringable.of('hello').finish('/').toString()).toBe('hello/');
    expect(Stringable.of('hello/').finish('/').toString()).toBe('hello/');
    expect(Stringable.of('world').start('hello ').toString()).toBe('hello world');
  });

  it('trim() / ltrim() / rtrim()', () => {
    expect(Stringable.of('  hi  ').trim().toString()).toBe('hi');
    expect(Stringable.of('  hi').ltrim().toString()).toBe('hi');
    expect(Stringable.of('hi  ').rtrim().toString()).toBe('hi');
  });

  it('padBoth() / padLeft() / padRight()', () => {
    expect(Stringable.of('hi').padBoth(5, '*').toString()).toBe('*hi**');
    expect(Stringable.of('hi').padLeft(4, '*').toString()).toBe('**hi');
    expect(Stringable.of('hi').padRight(4, '*').toString()).toBe('hi**');
  });

  it('substr()', () => {
    expect(Stringable.of('hello').substr(1, 3).toString()).toBe('ell');
    expect(Stringable.of('hello').substr(1).toString()).toBe('ello');
  });

  it('when() conditionable', () => {
    expect(Stringable.of('hello').when(true, (s) => s.upper()).toString()).toBe('HELLO');
    expect(Stringable.of('hello').when(false, (s) => s.upper()).toString()).toBe('hello');
  });

  it('whenEmpty()', () => {
    expect(Stringable.of('').whenEmpty((s) => s.append('empty')).toString()).toBe('empty');
    expect(Stringable.of('hi').whenEmpty((s) => s.append('empty')).toString()).toBe('hi');
  });

  it('length()', () => {
    expect(Stringable.of('hello').length()).toBe(5);
  });

  it('toString() / valueOf() / toPrimitive', () => {
    const s = Stringable.of('42');
    expect(s.toString()).toBe('42');
    expect(s.valueOf()).toBe('42');
    expect(Number(s)).toBe(42);
    expect(`${s}`).toBe('42');
  });

  it('chains multiple operations', () => {
    const result = Stringable.of('Hello World')
      .slug()
      .title()
      .toString();
    expect(result).toBe('Hello World');
  });
});

/* ──── Macroable ────────────────────────────────────────────────────── */

describe('Macroable', () => {
  class TestMacro extends Macroable {}
  class OtherMacro extends Macroable {}

  afterEach(() => {
    TestMacro.flushMacros();
    OtherMacro.flushMacros();
  });

  it('registers and calls static macros', () => {
    TestMacro.macro('greet', (name: string) => `Hello ${name}`);
    expect(TestMacro.callStatic('greet', 'World')).toBe('Hello World');
  });

  it('mixin() registers multiple macros', () => {
    TestMacro.mixin({
      add: (a: number, b: number) => a + b,
      multiply: (a: number, b: number) => a * b,
    });
    expect(TestMacro.callStatic('add', 2, 3)).toBe(5);
    expect(TestMacro.callStatic('multiply', 2, 3)).toBe(6);
  });

  it('hasMacro() checks existence', () => {
    expect(TestMacro.hasMacro('greet')).toBe(false);
    TestMacro.macro('greet', () => 'hi');
    expect(TestMacro.hasMacro('greet')).toBe(true);
  });

  it('flushMacros() clears all', () => {
    TestMacro.macro('greet', () => 'hi');
    TestMacro.flushMacros();
    expect(TestMacro.hasMacro('greet')).toBe(false);
  });

  it('callStatic() throws for unknown macro', () => {
    expect(() => TestMacro.callStatic('nonexistent')).toThrow('Static macro [nonexistent] not found');
  });

  it('macros are class-isolated', () => {
    TestMacro.macro('only', () => 'test only');
    expect(TestMacro.hasMacro('only')).toBe(true);
    expect(OtherMacro.hasMacro('only')).toBe(false);
  });

  it('callMacro() works on instances', () => {
    class Greeter extends Macroable {
      greet(name: string): string {
        return this.callMacro('greet', [name]) as string;
      }
    }
    Greeter.macro('greet', function (this: unknown, name: string) {
      return `Hello ${name}`;
    });
    const g = new Greeter();
    expect(g.greet('World')).toBe('Hello World');
  });
});
