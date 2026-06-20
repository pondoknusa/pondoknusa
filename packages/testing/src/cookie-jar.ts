/**
 * Parse Set-Cookie headers into a map for subsequent requests.
 */
export class CookieJar {
  private cookies = new Map<string, string>();

  absorb(response: Response): void {
    const raw = response.headers.getSetCookie?.() ?? [];
    if (raw.length > 0) {
      for (const line of raw) {
        this.storeLine(line);
      }
      return;
    }

    const single = response.headers.get('set-cookie');
    if (single) {
      this.storeLine(single);
    }
  }

  headerValue(): string | undefined {
    if (this.cookies.size === 0) {
      return undefined;
    }
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  set(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  clear(): void {
    this.cookies.clear();
  }

  private storeLine(line: string): void {
    const part = line.split(';')[0]?.trim();
    if (!part) {
      return;
    }
    const eq = part.indexOf('=');
    if (eq <= 0) {
      return;
    }
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    this.cookies.set(name, value);
  }
}