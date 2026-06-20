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
        return `The ${field} field is required.`;
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
        return `The ${field} field must be a valid email address.`;
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
        return `The ${field} field must be at least ${min} characters.`;
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
        return `The ${field} field must not exceed ${max} characters.`;
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
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) {
        return `The ${field} field must be an integer.`;
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
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < minimum) {
        return `The ${field} field must be at least ${minimum}.`;
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
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed > maximum) {
        return `The ${field} field must not be greater than ${maximum}.`;
      }
      return undefined;
    },
  };
}

const BUILT_IN_RULES: Record<string, (arg?: string) => ValidationRule> = {
  required: () => required(),
  email: () => email(),
  integer: () => integer(),
  min: (arg) => min(Number(arg)),
  max: (arg) => max(Number(arg)),
  min_length: (arg) => minLength(Number(arg)),
  max_length: (arg) => maxLength(Number(arg)),
};

export function parseRule(rule: Rule): ValidationRule[] {
  if (typeof rule !== 'string') {
    return [rule];
  }

  return rule.split('|').map((segment) => {
    const [name, arg] = segment.split(':');
    const factory = BUILT_IN_RULES[name ?? ''];
    if (!factory) {
      throw new Error(`Unknown validation rule: ${name}`);
    }
    return factory(arg);
  });
}