export function parseAcceptLanguage(
  header: string | null | undefined,
  available: string[],
): string | undefined {
  if (!header || available.length === 0) {
    return undefined;
  }

  const normalizedAvailable = new Map(
    available.map((locale) => [locale.toLowerCase(), locale]),
  );

  const candidates = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return {
        tag: tag?.trim().toLowerCase() ?? '',
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((left, right) => right.q - left.q);

  for (const candidate of candidates) {
    const exact = normalizedAvailable.get(candidate.tag);
    if (exact) {
      return exact;
    }

    const language = candidate.tag.split('-')[0];
    if (!language) {
      continue;
    }

    for (const [key, locale] of normalizedAvailable.entries()) {
      if (key === language || key.startsWith(`${language}-`)) {
        return locale;
      }
    }
  }

  return undefined;
}