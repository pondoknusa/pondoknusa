export const TYRAVEL_DOCS_ORIGIN = 'https://tyravel.dev';

export function docsLink(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${TYRAVEL_DOCS_ORIGIN}${normalized}`;
}