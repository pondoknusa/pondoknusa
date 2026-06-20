// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = unknown> = new (...args: any[]) => T;

export type Abstract<T = unknown> = string | symbol | Constructor<T>;

export type Factory<T = unknown> = (container: ContainerLike) => T;

export interface ContainerLike {
  make<T>(abstract: Abstract<T>): T;
}

export interface Binding<T = unknown> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}