type MacroFn = (...args: unknown[]) => unknown;
type MacroMap = Record<string, MacroFn>;

/**
 * Macroable — add methods to a class at runtime.
 *
 * Usage:
 *   class MyClass extends Macroable {}
 *   MyClass.macro('greet', (name: string) => `Hello ${name}`);
 *   MyClass.callStatic('greet', 'World'); // => 'Hello World'
 *
 * For instance-level macros:
 *   MyClass.macro('shout', function (this: InstanceType<typeof MyClass>, msg: string) {
 *     return msg.toUpperCase();
 *   });
 *   const inst = new MyClass();
 *   (inst as any).shout('hi');
 *
 * Note: TypeScript cannot type-check dynamically added methods.
 * Use type assertions or module augmentation for typed access.
 */
export class Macroable {
  private static macros: MacroMap = {};

  /** Register a macro method. */
  static macro(name: string, fn: MacroFn): void {
    this.macros[name] = fn;
  }

  /** Register multiple macros at once. */
  static mixin(methods: MacroMap): void {
    Object.assign(this.macros, methods);
  }

  /** Check if a macro exists. */
  static hasMacro(name: string): boolean {
    return name in this.macros;
  }

  /** Clear all registered macros. */
  static flushMacros(): void {
    this.macros = {};
  }

  /** Call a static macro directly. */
  static callStatic(name: string, ...args: unknown[]): unknown {
    const fn = this.macros[name];
    if (!fn) {
      throw new Error(`Static macro [${name}] not found.`);
    }
    return fn(...args);
  }

  /** Call a macro on an instance (via __call proxy). */
  protected callMacro(name: string, args: unknown[]): unknown {
    const macros = (this.constructor as typeof Macroable).macros;
    const fn = macros[name];
    if (!fn) {
      throw new Error(`Macro [${name}] not found on ${this.constructor.name}.`);
    }
    return fn.apply(this, args);
  }
}
