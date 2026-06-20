import type {
  Abstract,
  Binding,
  Constructor,
  ContainerLike,
  Factory,
} from './types.js';

export class BindingResolutionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BindingResolutionException';
  }
}

export class Container implements ContainerLike {
  private bindings = new Map<Abstract, Binding>();
  private aliases = new Map<Abstract, Abstract>();

  bind<T>(abstract: Abstract<T>, factory: Factory<T> | Constructor<T>): this {
    this.bindings.set(abstract, {
      factory: this.normalizeFactory(factory),
      singleton: false,
    });
    return this;
  }

  singleton<T>(abstract: Abstract<T>, factory: Factory<T> | Constructor<T>): this {
    this.bindings.set(abstract, {
      factory: this.normalizeFactory(factory),
      singleton: true,
    });
    return this;
  }

  instance<T>(abstract: Abstract<T>, instance: T): this {
    this.bindings.set(abstract, {
      factory: () => instance,
      singleton: true,
      instance,
    });
    return this;
  }

  alias<T>(abstract: Abstract<T>, alias: Abstract<T>): this {
    this.aliases.set(alias, abstract);
    return this;
  }

  make<T>(abstract: Abstract<T>): T {
    return this.resolve(abstract, new Set());
  }

  call<T, Args extends unknown[]>(
    callback: (...args: Args) => T,
    parameters: Record<string | number | symbol, unknown> = {},
  ): T {
    const args = this.resolveCallArguments(callback, parameters);
    return callback(...args);
  }

  flush(): void {
    for (const binding of this.bindings.values()) {
      delete binding.instance;
    }
  }

  private resolve<T>(abstract: Abstract<T>, resolving: Set<Abstract>): T {
    abstract = this.getAlias(abstract);

    if (this.isClass(abstract) && !this.bindings.has(abstract)) {
      return this.build(abstract, resolving);
    }

    const binding = this.bindings.get(abstract);
    if (!binding) {
      throw new BindingResolutionException(
        `Unable to resolve binding: ${this.describe(abstract)}`,
      );
    }

    if (binding.singleton) {
      if (binding.instance === undefined) {
        binding.instance = binding.factory(this);
      }
      return binding.instance as T;
    }

    return binding.factory(this) as T;
  }

  private build<T>(constructor: Constructor<T>, resolving: Set<Abstract>): T {
    if (resolving.has(constructor)) {
      throw new BindingResolutionException(
        `Circular dependency detected while resolving ${constructor.name}`,
      );
    }

    resolving.add(constructor);
    try {
      const dependencies = this.resolveConstructorDependencies(constructor);
      return new constructor(...dependencies);
    } finally {
      resolving.delete(constructor);
    }
  }

  private resolveConstructorDependencies<T>(_constructor: Constructor<T>): unknown[] {
    // Decorator-driven constructor injection will plug in here later.
    return [];
  }

  private resolveCallArguments<T, Args extends unknown[]>(
    callback: (...args: Args) => T,
    parameters: Record<string | number | symbol, unknown>,
  ): Args {
    const arity = callback.length;
    const args: unknown[] = [];

    for (let index = 0; index < arity; index++) {
      if (index in parameters) {
        args.push(parameters[index]);
        continue;
      }

      const name = this.getParameterName(callback, index);
      if (name && name in parameters) {
        args.push(parameters[name]);
        continue;
      }

      args.push(undefined);
    }

    return args as Args;
  }

  private getParameterName(callback: Function, index: number): string | undefined {
    const source = callback.toString();
    const match = source.match(/^[^(]*\(\s*([^)]*)\)/);
    if (!match?.[1]) {
      return undefined;
    }

    const params = match[1]
      .split(',')
      .map((param) => param.trim().split(/\s+/).pop())
      .filter((param): param is string => Boolean(param));

    return params[index];
  }

  private normalizeFactory<T>(factory: Factory<T> | Constructor<T>): Factory<T> {
    if (this.isClass(factory)) {
      return (container) => container.make(factory);
    }
    return factory;
  }

  private getAlias<T>(abstract: Abstract<T>): Abstract<T> {
    return (this.aliases.get(abstract) as Abstract<T> | undefined) ?? abstract;
  }

  private isClass<T>(value: Abstract<T> | Factory<T> | Constructor<T>): value is Constructor<T> {
    return typeof value === 'function' && value.prototype?.constructor === value;
  }

  private describe(abstract: Abstract): string {
    if (typeof abstract === 'string' || typeof abstract === 'symbol') {
      return String(abstract);
    }
    return abstract.name;
  }
}