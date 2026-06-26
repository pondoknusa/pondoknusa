export type RouteBindingResolver = (
  value: string,
) => unknown | Promise<unknown | null> | null;

export interface RouteBinding {
  resolve: RouteBindingResolver;
  /** When true, a missing record throws 404. Default true. */
  required?: boolean;
}

export function createRouteBinding(
  resolve: RouteBindingResolver,
  options: { required?: boolean } = {},
): RouteBinding {
  return {
    resolve,
    required: options.required ?? true,
  };
}