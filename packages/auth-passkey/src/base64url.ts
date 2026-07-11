/**
 * Base64url helpers shared by server and browser code paths.
 * Uses only Uint8Array + string ops so it runs in Node and browsers.
 */

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  let base64: string;
  if (typeof btoa === 'function') {
    base64 = btoa(binary);
  } else {
    base64 = Buffer.from(bytes).toString('base64');
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);

  if (typeof atob === 'function') {
    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  }

  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/** Encode a UTF-8 string as base64url (for WebAuthn user.id). */
export function stringToBase64Url(value: string): string {
  return toBase64Url(new TextEncoder().encode(value));
}

/** Decode base64url into a UTF-8 string. */
export function base64UrlToString(value: string): string {
  return new TextDecoder().decode(fromBase64Url(value));
}
