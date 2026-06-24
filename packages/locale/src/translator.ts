import { parsePluralPipe, pluralCategory } from './pluralization.js';
import { loadLocaleTranslations } from './load.js';
import type { LocaleConfig, TranslateOptions } from './types.js';

export class Translator {
  private locale: string;
  private readonly fallbackLocale: string;
  private readonly localesPath: string;
  private readonly availableLocales: string[];
  private readonly lines = new Map<string, Record<string, string>>();
  private readonly missingKeys = new Set<string>();

  constructor(
    private readonly basePath: string,
    config: Pick<LocaleConfig, 'locale' | 'fallback_locale' | 'locales_path' | 'available_locales'>,
  ) {
    this.locale = config.locale;
    this.fallbackLocale = config.fallback_locale;
    this.localesPath = config.locales_path ?? 'lang';
    this.availableLocales = config.available_locales ?? [config.locale, config.fallback_locale];
  }

  getLocale(): string {
    return this.locale;
  }

  getFallbackLocale(): string {
    return this.fallbackLocale;
  }

  getAvailableLocales(): string[] {
    return [...this.availableLocales];
  }

  setLocale(locale: string): this {
    this.locale = locale;
    return this;
  }

  addLines(locale: string, lines: Record<string, string>): this {
    const existing = this.lines.get(locale) ?? {};
    this.lines.set(locale, { ...existing, ...lines });
    return this;
  }

  async loadLocale(locale: string): Promise<void> {
    const lines = await loadLocaleTranslations(this.basePath, this.localesPath, locale);
    this.addLines(locale, lines);
  }

  async loadLocales(locales: string[]): Promise<void> {
    await Promise.all(locales.map((locale) => this.loadLocale(locale)));
  }

  has(key: string, locale?: string): boolean {
    return this.lookup(key, locale ?? this.locale) !== undefined
      || this.lookup(key, this.fallbackLocale) !== undefined;
  }

  get(key: string, options: TranslateOptions = {}): string {
    const locale = options.locale ?? this.locale;
    const replacements = options.replacements ?? {};
    const count = options.count;

    let message = this.resolveMessage(key, locale, count);
    if (message === undefined && locale !== this.fallbackLocale) {
      message = this.resolveMessage(key, this.fallbackLocale, count);
    }
    if (message === undefined) {
      this.missingKeys.add(key);
      message = options.fallback ?? key;
    }

    return this.replacePlaceholders(message, replacements);
  }

  choice(
    key: string,
    count: number,
    replacements: Record<string, string | number> = {},
    locale?: string,
  ): string {
    return this.get(key, {
      locale,
      count,
      replacements: { count, ...replacements },
    });
  }

  drainMissingKeys(): string[] {
    const keys = [...this.missingKeys].sort();
    this.missingKeys.clear();
    return keys;
  }

  private resolveMessage(
    key: string,
    locale: string,
    count?: number,
  ): string | undefined {
    const direct = this.lookup(key, locale);
    if (direct !== undefined && count === undefined) {
      return direct;
    }

    if (count !== undefined) {
      const pluralKey = `${key}.${pluralCategory(locale, count)}`;
      const plural = this.lookup(pluralKey, locale);
      if (plural !== undefined) {
        return plural;
      }

      if (direct !== undefined) {
        const piped = parsePluralPipe(direct, count);
        if (piped !== undefined) {
          return piped;
        }
        return direct;
      }
    }

    return direct;
  }

  private lookup(key: string, locale: string): string | undefined {
    return this.lines.get(locale)?.[key];
  }

  private replacePlaceholders(
    message: string,
    replacements: Record<string, string | number>,
  ): string {
    let output = message;
    for (const [name, value] of Object.entries(replacements)) {
      output = output.replaceAll(`:${name}`, String(value));
    }
    return output;
  }
}

export function createTranslator(
  basePath: string,
  config: LocaleConfig,
): Translator {
  return new Translator(basePath, config);
}