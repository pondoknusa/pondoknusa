export type TranslationTree = Record<string, unknown>;

export interface LocaleConfig {
  locale: string;
  fallback_locale: string;
  faker_locale?: string;
  locales_path?: string;
  available_locales?: string[];
}

export interface TranslateOptions {
  replacements?: Record<string, string | number>;
  count?: number;
  locale?: string;
  fallback?: string;
}