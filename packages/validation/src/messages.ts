export type ValidationMessageResolver = (
  key: string,
  replacements: Record<string, string | number>,
) => string;

let resolver: ValidationMessageResolver | undefined;

const DEFAULTS: Record<string, string> = {
  'validation.required': 'The :attribute field is required.',
  'validation.email': 'The :attribute field must be a valid email address.',
  'validation.string': 'The :attribute field must be a string.',
  'validation.integer': 'The :attribute field must be an integer.',
  'validation.min.string': 'The :attribute field must be at least :min characters.',
  'validation.max.string': 'The :attribute field must not exceed :max characters.',
  'validation.min.numeric': 'The :attribute field must be at least :min.',
  'validation.max.numeric': 'The :attribute field must not be greater than :max.',
};

export function setValidationMessageResolver(
  next: ValidationMessageResolver | undefined,
): void {
  resolver = next;
}

export function validationMessage(
  key: string,
  replacements: Record<string, string | number> = {},
): string {
  if (resolver) {
    const resolved = resolver(key, replacements);
    if (resolved !== key) {
      return resolved;
    }
  }

  const template = DEFAULTS[key] ?? key;
  let message = template;
  for (const [name, value] of Object.entries(replacements)) {
    message = message.replaceAll(`:${name}`, String(value));
  }
  return message;
}