import { GraphQLParseError } from './errors.js';
import type { FieldSelection, ParsedOperation, SelectionSet } from './types.js';

export function parseQuery(source: string): ParsedOperation {
  const cleaned = stripComments(source).trim();
  if (!cleaned) {
    throw new GraphQLParseError('GraphQL query cannot be empty.');
  }

  let type: ParsedOperation['type'] = 'query';
  let name: string | undefined;
  let variableDefinitions: Record<string, string> = {};
  let selectionSource = cleaned;

  const operationMatch = cleaned.match(/^(query|mutation)\s*(\w+)?\s*(\([^)]*\))?\s*(\{.*)$/is);
  if (operationMatch) {
    type = operationMatch[1]!.toLowerCase() as ParsedOperation['type'];
    name = operationMatch[2];
    if (operationMatch[3]) {
      variableDefinitions = parseVariableDefinitions(operationMatch[3]);
    }
    selectionSource = operationMatch[4]!;
  } else if (!cleaned.startsWith('{')) {
    throw new GraphQLParseError('GraphQL document must start with query, mutation, or {. ');
  }

  return {
    type,
    name,
    variableDefinitions,
    selectionSet: parseSelectionSet(selectionSource),
  };
}

function stripComments(source: string): string {
  return source.replace(/#[^\n\r]*/g, '');
}

function parseVariableDefinitions(source: string): Record<string, string> {
  const inner = source.trim().replace(/^\(/, '').replace(/\)$/, '');
  const definitions: Record<string, string> = {};
  if (!inner) {
    return definitions;
  }

  for (const part of splitTopLevel(inner, ',')) {
    const match = part.trim().match(/^\$([A-Za-z_][\w]*)\s*:\s*(.+)$/);
    if (!match) {
      continue;
    }
    definitions[match[1]!] = match[2]!.trim();
  }

  return definitions;
}

function parseSelectionSet(source: string): SelectionSet {
  const trimmed = source.trim();
  if (!trimmed.startsWith('{')) {
    throw new GraphQLParseError('Selection set must start with {. ');
  }

  const inner = trimmed.slice(1, findClosingBrace(trimmed, 0));
  const fields: FieldSelection[] = [];
  let remaining = inner.trim();

  while (remaining) {
    const { field, rest } = parseNextField(remaining);
    fields.push(field);
    remaining = rest.trim();
  }

  return { fields };
}

function parseNextField(source: string): { field: FieldSelection; rest: string } {
  if (!source.trim()) {
    throw new GraphQLParseError('Selection set cannot be empty.');
  }

  let remaining = source.trim();
  let alias: string | undefined;
  const nameMatch = remaining.match(/^([A-Za-z_][\w]*)/);
  if (!nameMatch) {
    throw new GraphQLParseError(`Invalid field name near [${source}].`);
  }

  let name = nameMatch[1]!;
  remaining = remaining.slice(name.length).trim();

  if (remaining.startsWith(':')) {
    alias = name;
    remaining = remaining.slice(1).trim();
    const aliasMatch = remaining.match(/^([A-Za-z_][\w]*)/);
    if (!aliasMatch) {
      throw new GraphQLParseError(`Expected field name after alias in [${source}].`);
    }
    name = aliasMatch[1]!;
    remaining = remaining.slice(name.length).trim();
  }

  let args: Record<string, unknown> | undefined;
  if (remaining.startsWith('(')) {
    const argsEnd = findClosingParen(remaining, 0);
    args = parseArguments(remaining.slice(1, argsEnd));
    remaining = remaining.slice(argsEnd + 1).trim();
  }

  let selectionSet: SelectionSet | undefined;
  if (remaining.startsWith('{')) {
    const end = findClosingBrace(remaining, 0);
    selectionSet = parseSelectionSet(remaining.slice(0, end + 1));
    remaining = remaining.slice(end + 1);
  }

  return {
    field: { name, alias, args, selectionSet },
    rest: remaining,
  };
}

function parseArguments(source: string): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  if (!source.trim()) {
    return args;
  }

  for (const part of splitTopLevel(source, ',')) {
    const match = part.trim().match(/^([A-Za-z_][\w]*)\s*:\s*(.+)$/);
    if (!match) {
      continue;
    }
    args[match[1]!] = parseValue(match[2]!.trim());
  }

  return args;
}

function parseValue(raw: string): unknown {
  if (raw.startsWith('$')) {
    return { $var: raw.slice(1) };
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  if (raw === 'null') {
    return null;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
    return Number(raw);
  }
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1).replace(/\\"/g, '"');
  }
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return splitTopLevel(inner, ',').map((entry) => parseValue(entry.trim()));
  }
  if (raw.startsWith('{') && raw.endsWith('}')) {
    const object: Record<string, unknown> = {};
    const inner = raw.slice(1, -1).trim();
    for (const part of splitTopLevel(inner, ',')) {
      const match = part.trim().match(/^([A-Za-z_][\w]*)\s*:\s*(.+)$/);
      if (match) {
        object[match[1]!] = parseValue(match[2]!.trim());
      }
    }
    return object;
  }

  throw new GraphQLParseError(`Unsupported GraphQL value [${raw}].`);
}

function splitTopLevel(source: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let current = '';
  let inString = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    const prev = source[index - 1];

    if (char === '"' && prev !== '\\') {
      inString = !inString;
    }

    if (!inString) {
      if (char === '(') depthParen += 1;
      if (char === ')') depthParen -= 1;
      if (char === '{') depthBrace += 1;
      if (char === '}') depthBrace -= 1;
      if (char === '[') depthBracket += 1;
      if (char === ']') depthBracket -= 1;
      if (
        char === delimiter
        && depthParen === 0
        && depthBrace === 0
        && depthBracket === 0
      ) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function findClosingBrace(source: string, startIndex: number): number {
  let depth = 0;
  let inString = false;
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index]!;
    const prev = source[index - 1];
    if (char === '"' && prev !== '\\') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  throw new GraphQLParseError('Unclosed selection set.');
}

function findClosingParen(source: string, startIndex: number): number {
  let depth = 0;
  let inString = false;
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index]!;
    const prev = source[index - 1];
    if (char === '"' && prev !== '\\') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  throw new GraphQLParseError('Unclosed argument list.');
}

export function resolveArgumentValues(
  args: Record<string, unknown> | undefined,
  variables: Record<string, unknown>,
): Record<string, unknown> {
  if (!args) {
    return {};
  }

  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    resolved[key] = resolveValue(value, variables);
  }
  return resolved;
}

function resolveValue(value: unknown, variables: Record<string, unknown>): unknown {
  if (value && typeof value === 'object' && '$var' in (value as Record<string, unknown>)) {
    const name = String((value as Record<string, unknown>).$var);
    return variables[name];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => resolveValue(entry, variables));
  }
  if (value && typeof value === 'object') {
    const object: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      object[key] = resolveValue(entry, variables);
    }
    return object;
  }
  return value;
}