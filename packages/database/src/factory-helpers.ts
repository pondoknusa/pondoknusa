let sequence = 0;
let factoryLocale = 'en';

export function resetFactoryHelpers(): void {
  sequence = 0;
  factoryLocale = 'en';
}

export function setFactoryLocale(locale: string): void {
  factoryLocale = locale;
}

export function getFactoryLocale(): string {
  return factoryLocale;
}

export function fakeSequence(): number {
  sequence += 1;
  return sequence;
}

export function fakeEmail(prefix = 'user'): string {
  return `${prefix}.${fakeSequence()}.${Date.now()}@example.com`;
}

export function fakeName(): string {
  const names = ['Ada', 'Grace', 'Alan', 'Katherine', 'Linus', 'Margaret'];
  const index = (fakeSequence() - 1) % names.length;
  return names[index] ?? `User ${fakeSequence()}`;
}

export function fakeSlug(prefix = 'item'): string {
  return `${prefix}-${fakeSequence()}`;
}

export function fakeText(wordCount = 3): string {
  return Array.from({ length: wordCount }, (_, index) => `word${fakeSequence() + index}`).join(
    ' ',
  );
}

export function fakeLocalizedDate(locale = factoryLocale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date());
}