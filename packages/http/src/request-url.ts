/**
 * Shared symbol used to carry an already-parsed request pathname from the
 * HTTP server adapter to the kernel/router, avoiding a second `new URL()`.
 *
 * Registered globally (`Symbol.for`) so it survives duplicated package
 * copies in linked workspaces.
 */
const REQUEST_PATHNAME = Symbol.for('pondoknusa.requestPathname');

type PathnameCarrier = Request & { [REQUEST_PATHNAME]?: string };

export function attachRequestPathname(request: Request, pathname: string): Request {
  (request as PathnameCarrier)[REQUEST_PATHNAME] = pathname;
  return request;
}

export function readRequestPathname(request: Request): string | undefined {
  return (request as PathnameCarrier)[REQUEST_PATHNAME];
}
