import { validationMessage } from './messages.js';

export type Rule = string | ValidationRule;

export interface ValidationRule {
  validate(value: unknown, field: string): string | undefined;
}

export type ValidationRules<T extends Record<string, unknown>> = {
  [K in keyof T]?: Rule | Rule[];
};

export function required(): ValidationRule {
  return {
    validate(value, field) {
      if (value === undefined || value === null || value === '') {
        return validationMessage('validation.required', { attribute: field });
      }
      return undefined;
    },
  };
}

export function email(): ValidationRule {
  return {
    validate(value, field) {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return validationMessage('validation.email', { attribute: field });
      }
      return undefined;
    },
  };
}

export function minLength(min: number): ValidationRule {
  return {
    validate(value, field) {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (typeof value !== 'string' || value.length < min) {
        return validationMessage('validation.min.string', { attribute: field, min });
      }
      return undefined;
    },
  };
}

export function maxLength(max: number): ValidationRule {
  return {
    validate(value, field) {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (typeof value !== 'string' || value.length > max) {
        return validationMessage('validation.max.string', { attribute: field, max });
      }
      return undefined;
    },
  };
}

export function integer(): ValidationRule {
  return {
    validate(value, field) {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      if (typeof value === 'boolean' || Array.isArray(value)) {
        return validationMessage('validation.integer', { attribute: field });
      }
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) {
        return validationMessage('validation.integer', { attribute: field });
      }
      return undefined;
    },
  };
}

export function string(): ValidationRule {
  return {
    validate(value, field) {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      if (typeof value !== 'string') {
        return validationMessage('validation.string', { attribute: field });
      }
      return undefined;
    },
  };
}

export function min(minimum: number): ValidationRule {
  return {
    validate(value, field) {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      if (typeof value === 'string') {
        if (value.length < minimum) {
          return validationMessage('validation.min.string', {
            attribute: field,
            min: minimum,
          });
        }
        return undefined;
      }
      if (typeof value === 'boolean' || Array.isArray(value)) {
        return validationMessage('validation.min.numeric', {
          attribute: field,
          min: minimum,
        });
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < minimum) {
        return validationMessage('validation.min.numeric', {
          attribute: field,
          min: minimum,
        });
      }
      return undefined;
    },
  };
}

export function max(maximum: number): ValidationRule {
  return {
    validate(value, field) {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      if (typeof value === 'string') {
        if (value.length > maximum) {
          return validationMessage('validation.max.string', {
            attribute: field,
            max: maximum,
          });
        }
        return undefined;
      }
      if (typeof value === 'boolean' || Array.isArray(value)) {
        return validationMessage('validation.max.numeric', {
          attribute: field,
          max: maximum,
        });
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed > maximum) {
        return validationMessage('validation.max.numeric', {
          attribute: field,
          max: maximum,
        });
      }
      return undefined;
    },
  };
}

const BUILT_IN_RULES: Record<string, (arg?: string) => ValidationRule> = {
  required: () => required(),
  email: () => email(),
  string: () => string(),
  integer: () => integer(),
  min: (arg) => min(Number(arg)),
  max: (arg) => max(Number(arg)),
  min_length: (arg) => minLength(Number(arg)),
  max_length: (arg) => maxLength(Number(arg)),
};

export interface ParsedRuleSet {
  sometimes: boolean;
  rules: ValidationRule[];
}

function splitRuleSegments(rule: string): string[] {
  return rule
    .split('|')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

export function parseRuleSet(rule: Rule | Rule[]): ParsedRuleSet {
  const entries = Array.isArray(rule) ? rule : [rule];
  let sometimes = false;
  const concrete: Rule[] = [];

  for (const entry of entries) {
    if (typeof entry === 'string') {
      for (const segment of splitRuleSegments(entry)) {
        if (segment === 'sometimes') {
          sometimes = true;
        } else {
          concrete.push(segment);
        }
      }
      continue;
    }

    concrete.push(entry);
  }

  return {
    sometimes,
    rules: concrete.flatMap((entry) => parseRule(entry)),
  };
}

export function parseRule(rule: Rule): ValidationRule[] {
  if (typeof rule !== 'string') {
    return [rule];
  }

  return splitRuleSegments(rule)
    .filter((segment) => segment !== 'sometimes')
    .map((segment) => {
      const [name, arg] = segment.split(':');
      const factory = BUILT_IN_RULES[name ?? ''];
      if (!factory) {
        throw new Error(`Unknown validation rule: ${name}`);
      }
      return factory(arg);
    });
}