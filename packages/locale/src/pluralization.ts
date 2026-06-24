export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

const EN_RULES: Array<{ category: PluralCategory; test: (count: number) => boolean }> = [
  { category: 'one', test: (count) => count === 1 },
  { category: 'other', test: () => true },
];

const LOCALE_RULES: Record<string, typeof EN_RULES> = {
  en: EN_RULES,
};

export function pluralCategory(locale: string, count: number): PluralCategory {
  const rules = LOCALE_RULES[locale.split('-')[0] ?? locale] ?? EN_RULES;
  for (const rule of rules) {
    if (rule.test(count)) {
      return rule.category;
    }
  }
  return 'other';
}

export function parsePluralPipe(message: string, count: number): string | undefined {
  if (!message.includes('|')) {
    return undefined;
  }

  const segments = message.split('|').map((segment) => segment.trim());
  for (const segment of segments) {
    const rangeMatch = segment.match(/^\[(\d+|\*),(\d+|\*)\]\s*(.+)$/);
    if (rangeMatch) {
      const minRaw = rangeMatch[1];
      const maxRaw = rangeMatch[2];
      const text = rangeMatch[3] ?? '';
      const min = minRaw === '*' ? Number.NEGATIVE_INFINITY : Number(minRaw);
      const max = maxRaw === '*' ? Number.POSITIVE_INFINITY : Number(maxRaw);
      if (count >= min && count <= max) {
        return text;
      }
      continue;
    }

    const exactMatch = segment.match(/^\{(\d+)\}\s*(.+)$/);
    if (exactMatch) {
      const exact = Number(exactMatch[1]);
      if (count === exact) {
        return exactMatch[2] ?? '';
      }
    }
  }

  return segments[segments.length - 1];
}