import type { CompiledTemplate, TemplateOp } from './types.js';

const LAYOUT_RE = /^@layout\(\s*['"]([^'"]+)['"]\s*\)\s*$/m;
const SECTION_START_RE = /^@section\(\s*['"]([^'"]+)['"]\s*\)\s*$/;
const SECTION_END_RE = /^@endsection\s*$/;
const YIELD_RE = /^@yield\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)\s*$/;
const INCLUDE_RE = /^@include\(\s*['"]([^'"]+)['"]\s*(?:,\s*(.+))?\)\s*$/;
const COMPONENT_RE = /^@component\(\s*['"]([^'"]+)['"]\s*(?:,\s*(.+))?\)\s*$/;
const ENDCOMPONENT_RE = /^@endcomponent\s*$/;
const SLOT_START_RE = /^@slot\(\s*['"]([^'"]+)['"]\s*\)\s*$/;
const SLOT_END_RE = /^@endslot\s*$/;
const IF_RE = /^@if\s*\((.+)\)\s*$/;
const ELSEIF_RE = /^@elseif\s*\((.+)\)\s*$/;
const ELSE_RE = /^@else\s*$/;
const ENDIF_RE = /^@endif\s*$/;
const UNLESS_RE = /^@unless\s*\((.+)\)\s*$/;
const ENDUNLESS_RE = /^@endunless\s*$/;
const ISSET_RE = /^@isset\s*\((.+)\)\s*$/;
const ENDISSET_RE = /^@endisset\s*$/;
const EMPTY_RE = /^@empty\s*\((.+)\)\s*$/;
const ENDEMPTY_RE = /^@endempty\s*$/;
const FOREACH_RE = /^@foreach\s*\((.+)\)\s*$/;
const ENDFOREACH_RE = /^@endforeach\s*$/;
const FORELSE_RE = /^@forelse\s*\((.+)\)\s*$/;
const FORELSE_EMPTY_RE = /^@empty\s*$/;
const ENDFORELSE_RE = /^@endforelse\s*$/;
const PUSH_START_RE = /^@push\(\s*['"]([^'"]+)['"]\s*\)\s*$/;
const PUSH_END_RE = /^@endpush\s*$/;
const STACK_RE = /^@stack\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)\s*$/;
const ECHO_RE = /\{\{\s*(.+?)\s*\}\}/g;
const RAW_ECHO_RE = /\{!!\s*(.+?)\s*!!\}/g;

export function compile(source: string): CompiledTemplate {
  const layoutMatch = source.match(LAYOUT_RE);
  const layout = layoutMatch?.[1];
  const body = layout ? source.replace(LAYOUT_RE, '').trimStart() : source;

  return {
    layout,
    ops: parseOps(body),
  };
}

function parseOps(source: string): TemplateOp[] {
  const ops: TemplateOp[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const nextSpecial = findNextSpecial(source, cursor);

    if (nextSpecial === -1) {
      appendText(ops, source.slice(cursor));
      break;
    }

    if (nextSpecial > cursor) {
      appendText(ops, source.slice(cursor, nextSpecial));
      cursor = nextSpecial;
      continue;
    }

    const remaining = source.slice(cursor);

    if (remaining.startsWith('{{')) {
      const match = remaining.match(/^\{\{\s*(.+?)\s*\}\}/);
      if (match) {
        ops.push({ type: 'echo', expression: match[1]!, raw: false });
        cursor += match[0].length;
        continue;
      }
    }

    if (remaining.startsWith('{!!')) {
      const match = remaining.match(/^\{!!\s*(.+?)\s*!!\}/);
      if (match) {
        ops.push({ type: 'echo', expression: match[1]!, raw: true });
        cursor += match[0].length;
        continue;
      }
    }

    const line = takeLine(source, cursor);
    const trimmed = line.trim();

    const ifMatch = trimmed.match(IF_RE);
    if (ifMatch) {
      const block = parseConditionalBlock(source, cursor);
      ops.push(block.op);
      cursor = block.end;
      continue;
    }

    const unlessMatch = trimmed.match(UNLESS_RE);
    if (unlessMatch) {
      const block = parseSimpleConditionalBlock(
        source,
        cursor,
        UNLESS_RE,
        ENDUNLESS_RE,
        'unless',
      );
      ops.push(block.op);
      cursor = block.end;
      continue;
    }

    const issetMatch = trimmed.match(ISSET_RE);
    if (issetMatch) {
      const block = parseSimpleConditionalBlock(
        source,
        cursor,
        ISSET_RE,
        ENDISSET_RE,
        'isset',
      );
      ops.push(block.op);
      cursor = block.end;
      continue;
    }

    const emptyMatch = trimmed.match(EMPTY_RE);
    if (emptyMatch) {
      const block = parseSimpleConditionalBlock(
        source,
        cursor,
        EMPTY_RE,
        ENDEMPTY_RE,
        'empty',
      );
      ops.push(block.op);
      cursor = block.end;
      continue;
    }

    const forelseMatch = trimmed.match(FORELSE_RE);
    if (forelseMatch) {
      const block = parseForelseBlock(source, cursor);
      ops.push(block.op);
      cursor = block.end;
      continue;
    }

    const foreachMatch = trimmed.match(FOREACH_RE);
    if (foreachMatch) {
      const block = parseForeachBlock(source, cursor);
      ops.push(block.op);
      cursor = block.end;
      continue;
    }

    const pushMatch = trimmed.match(PUSH_START_RE);
    if (pushMatch) {
      const block = parsePushBlock(source, cursor, pushMatch[1]!);
      ops.push(block.op);
      cursor = block.end;
      continue;
    }

    const stackMatch = trimmed.match(STACK_RE);
    if (stackMatch) {
      ops.push({
        type: 'stack',
        name: stackMatch[1]!,
        defaultValue: stackMatch[2],
      });
      cursor += line.length;
      continue;
    }

    const sectionMatch = trimmed.match(SECTION_START_RE);
    if (sectionMatch) {
      const block = parseSectionBlock(source, cursor, sectionMatch[1]!);
      ops.push(block.op);
      cursor = block.end;
      continue;
    }

    const yieldMatch = trimmed.match(YIELD_RE);
    if (yieldMatch) {
      ops.push({
        type: 'yield',
        name: yieldMatch[1]!,
        defaultValue: yieldMatch[2],
      });
      cursor += line.length;
      continue;
    }

    const includeMatch = trimmed.match(INCLUDE_RE);
    if (includeMatch) {
      ops.push({
        type: 'include',
        name: includeMatch[1]!,
        dataExpression: includeMatch[2]?.trim(),
      });
      cursor += line.length;
      continue;
    }

    const componentMatch = trimmed.match(COMPONENT_RE);
    if (componentMatch) {
      const closeAt = findPartnerEndComponent(source, cursor + line.length);
      if (closeAt !== -1) {
        const block = parseComponentBlock(
          source,
          cursor,
          componentMatch[1]!,
          componentMatch[2]?.trim(),
          closeAt,
        );
        ops.push(block.op);
        cursor = block.end;
        continue;
      }

      ops.push({
        type: 'component',
        name: componentMatch[1]!,
        dataExpression: componentMatch[2]?.trim(),
      });
      cursor += line.length;
      continue;
    }

    appendText(ops, line);
    cursor += line.length;
  }

  return ops;
}

function parseConditionalBlock(
  source: string,
  start: number,
): { op: TemplateOp; end: number } {
  const firstLine = takeLine(source, start);
  const expression = firstLine.trim().match(IF_RE)?.[1] ?? 'false';
  const contentStart = start + firstLine.length;
  const contentEnd = findNestedEnd(source, contentStart, IF_RE, ENDIF_RE);
  const endifLine = takeLine(source, contentEnd);
  const branches = splitConditionalBranches(source.slice(contentStart, contentEnd));
  const [first, ...rest] = branches;
  const elseBody = rest.length > 0 ? flattenBranches(rest) : undefined;

  return {
    op: {
      type: 'if',
      expression,
      body: first?.body ?? [],
      elseBody,
    },
    end: contentEnd + endifLine.length,
  };
}

function splitConditionalBranches(
  content: string,
): Array<{ expression?: string; body: TemplateOp[] }> {
  const branches: Array<{ expression?: string; body: TemplateOp[] }> = [{ body: [] }];
  let cursor = 0;

  while (cursor < content.length) {
    const line = takeLine(content, cursor);
    const trimmed = line.trim();

    if (ELSEIF_RE.test(trimmed)) {
      branches.push({
        expression: trimmed.match(ELSEIF_RE)?.[1],
        body: [],
      });
      cursor += line.length;
      continue;
    }

    if (ELSE_RE.test(trimmed)) {
      branches.push({ body: [] });
      cursor += line.length;
      continue;
    }

    const end = findBlockBoundary(content, cursor, [ELSEIF_RE, ELSE_RE]);
    const chunk = content.slice(cursor, end);
    const current = branches[branches.length - 1];

    if (current && chunk.length > 0) {
      current.body.push(...parseOps(chunk));
    }

    if (end <= cursor) {
      cursor += Math.max(line.length, 1);
      continue;
    }

    cursor = end;
  }

  return branches;
}

function flattenBranches(
  branches: Array<{ expression?: string; body: TemplateOp[] }>,
): TemplateOp[] {
  if (branches.length === 0) {
    return [];
  }

  const [current, ...remaining] = branches;

  if (!current) {
    return [];
  }

  if (current.expression === undefined) {
    return current.body;
  }

  return [
    {
      type: 'if',
      expression: current.expression,
      body: current.body,
      elseBody: flattenBranches(remaining),
    },
  ];
}

function parseSimpleConditionalBlock(
  source: string,
  start: number,
  startRe: RegExp,
  endRe: RegExp,
  mode: 'unless' | 'isset' | 'empty',
): { op: TemplateOp; end: number } {
  const firstLine = takeLine(source, start);
  const expression = firstLine.trim().match(startRe)?.[1] ?? '';
  const contentStart = start + firstLine.length;
  const contentEnd = findNestedEnd(source, contentStart, startRe, endRe);
  const endLine = takeLine(source, contentEnd);

  return {
    op: {
      type: 'if',
      mode,
      expression,
      body: parseOps(source.slice(contentStart, contentEnd)),
    },
    end: contentEnd + endLine.length,
  };
}

function parseForelseBlock(
  source: string,
  start: number,
): { op: TemplateOp; end: number } {
  const firstLine = takeLine(source, start);
  const expression = firstLine.trim().match(FORELSE_RE)?.[1] ?? '[]';
  const contentStart = start + firstLine.length;
  const contentEnd = findNestedEnd(source, contentStart, FORELSE_RE, ENDFORELSE_RE);
  const endLine = takeLine(source, contentEnd);
  const content = source.slice(contentStart, contentEnd);
  const emptyBoundary = findForelseEmptyBoundary(content);

  return {
    op: {
      type: 'forelse',
      expression,
      body: parseOps(content.slice(0, emptyBoundary.start)),
      emptyBody: parseOps(content.slice(emptyBoundary.end)),
    },
    end: contentEnd + endLine.length,
  };
}

function findForelseEmptyBoundary(content: string): { start: number; end: number } {
  let cursor = 0;
  let depth = 0;

  while (cursor < content.length) {
    const line = takeLine(content, cursor);
    const trimmed = line.trim();

    if (FORELSE_RE.test(trimmed)) {
      depth += 1;
    }

    if (ENDFORELSE_RE.test(trimmed)) {
      depth -= 1;
    }

    if (FORELSE_EMPTY_RE.test(trimmed) && depth === 0) {
      const end = cursor + line.length;
      return { start: cursor, end };
    }

    cursor += line.length;
  }

  return { start: content.length, end: content.length };
}

function parsePushBlock(
  source: string,
  start: number,
  name: string,
): { op: TemplateOp; end: number } {
  const headerLine = takeLine(source, start);
  const contentStart = start + headerLine.length;
  const contentEnd = findNestedEnd(source, contentStart, PUSH_START_RE, PUSH_END_RE);
  const endLine = takeLine(source, contentEnd);

  return {
    op: {
      type: 'push',
      name,
      body: parseOps(source.slice(contentStart, contentEnd)),
    },
    end: contentEnd + endLine.length,
  };
}

function parseForeachBlock(
  source: string,
  start: number,
): { op: TemplateOp; end: number } {
  const firstLine = takeLine(source, start);
  const expression = firstLine.trim().match(FOREACH_RE)?.[1] ?? '[]';
  const contentStart = start + firstLine.length;
  const contentEnd = findNestedEnd(source, contentStart, FOREACH_RE, ENDFOREACH_RE);
  const endLine = takeLine(source, contentEnd);

  return {
    op: {
      type: 'foreach',
      expression,
      body: parseOps(source.slice(contentStart, contentEnd)),
    },
    end: contentEnd + endLine.length,
  };
}

function parseComponentBlock(
  source: string,
  start: number,
  name: string,
  dataExpression: string | undefined,
  closeAt: number,
): { op: TemplateOp; end: number } {
  const headerLine = takeLine(source, start);
  const bodyStart = start + headerLine.length;
  const body = source.slice(bodyStart, closeAt);
  const closeLine = takeLine(source, closeAt);
  const { defaultSlot, namedSlots } = parseSlotAwareBody(body);

  return {
    op: {
      type: 'component',
      name,
      dataExpression,
      defaultSlot: defaultSlot.length > 0 ? defaultSlot : undefined,
      namedSlots: Object.keys(namedSlots).length > 0 ? namedSlots : undefined,
    },
    end: closeAt + closeLine.length,
  };
}

function findPartnerEndComponent(source: string, searchStart: number): number {
  let depth = 1;
  let cursor = searchStart;

  while (cursor < source.length) {
    const line = takeLine(source, cursor);
    const trimmed = line.trim();

    if (COMPONENT_RE.test(trimmed)) {
      depth += 1;
    }

    if (ENDCOMPONENT_RE.test(trimmed)) {
      depth -= 1;
      if (depth === 0) {
        return cursor;
      }
    }

    cursor += line.length;
  }

  return -1;
}

function parseSlotAwareBody(content: string): {
  defaultSlot: TemplateOp[];
  namedSlots: Record<string, TemplateOp[]>;
} {
  const defaultSlot: TemplateOp[] = [];
  const namedSlots: Record<string, TemplateOp[]> = {};
  let cursor = 0;

  while (cursor < content.length) {
    const line = takeLine(content, cursor);
    const trimmed = line.trim();
    const slotMatch = trimmed.match(SLOT_START_RE);

    if (slotMatch) {
      const slotContentStart = cursor + line.length;
      const slotContentEnd = findNestedEnd(
        content,
        slotContentStart,
        SLOT_START_RE,
        SLOT_END_RE,
      );
      const endLine = takeLine(content, slotContentEnd);
      namedSlots[slotMatch[1]!] = parseOps(content.slice(slotContentStart, slotContentEnd));
      cursor = slotContentEnd + endLine.length;
      continue;
    }

    const nextSlot = findNextSlotStart(content, cursor);
    const chunkEnd = nextSlot === -1 ? content.length : nextSlot;
    const chunk = content.slice(cursor, chunkEnd);

    if (chunk.trim().length > 0) {
      defaultSlot.push(...parseOps(chunk));
    }

    cursor = nextSlot === -1 ? content.length : nextSlot;
  }

  return { defaultSlot, namedSlots };
}

function findNextSlotStart(source: string, start: number): number {
  let cursor = start;

  while (cursor < source.length) {
    const line = takeLine(source, cursor);
    if (SLOT_START_RE.test(line.trim())) {
      return cursor;
    }
    cursor += line.length;
  }

  return -1;
}

function parseSectionBlock(
  source: string,
  start: number,
  name: string,
): { op: TemplateOp; end: number } {
  const headerLine = takeLine(source, start);
  const contentStart = start + headerLine.length;
  const contentEnd = findNestedEnd(source, contentStart, SECTION_START_RE, SECTION_END_RE);
  const endLine = takeLine(source, contentEnd);

  return {
    op: {
      type: 'section',
      name,
      body: parseOps(source.slice(contentStart, contentEnd)),
    },
    end: contentEnd + endLine.length,
  };
}

function findNestedEnd(
  source: string,
  start: number,
  openRe: RegExp,
  closeRe: RegExp,
): number {
  let cursor = start;
  let depth = 0;

  while (cursor < source.length) {
    const line = takeLine(source, cursor);
    const trimmed = line.trim();

    if (openRe.test(trimmed)) {
      depth += 1;
    }

    if (closeRe.test(trimmed)) {
      if (depth === 0) {
        return cursor;
      }
      depth -= 1;
    }

    cursor += line.length;
  }

  return source.length;
}

function findBlockBoundary(
  source: string,
  start: number,
  patterns: RegExp[],
): number {
  let cursor = start;

  while (cursor < source.length) {
    const line = takeLine(source, cursor);
    const trimmed = line.trim();

    if (patterns.some((pattern) => pattern.test(trimmed))) {
      return cursor;
    }

    if (source.slice(cursor).startsWith('{{') || source.slice(cursor).startsWith('{!!')) {
      return cursor;
    }

    cursor += line.length;
  }

  return source.length;
}

function findNextSpecial(source: string, start: number): number {
  const indexes = [
    source.indexOf('{{', start),
    source.indexOf('{!!', start),
    source.indexOf('@', start),
  ].filter((index) => index !== -1);

  return indexes.length > 0 ? Math.min(...indexes) : -1;
}

function takeLine(source: string, start: number): string {
  const end = source.indexOf('\n', start);
  if (end === -1) {
    return source.slice(start);
  }
  return source.slice(start, end + 1);
}

function appendText(ops: TemplateOp[], value: string): void {
  if (!value) {
    return;
  }

  for (const op of parseTextWithDirectives(value)) {
    const last = ops[ops.length - 1];
    if (op.type === 'text' && last?.type === 'text') {
      last.value += op.value;
      continue;
    }
    ops.push(op);
  }
}

function parseTextWithDirectives(text: string): TemplateOp[] {
  const ops: TemplateOp[] = [];
  const pattern =
    /@yield\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)|@stack\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)|@include\(\s*['"]([^'"]+)['"]\s*(?:,\s*(.+?))?\s*\)|@component\(\s*['"]([^'"]+)['"]\s*(?:,\s*(.+?))?\s*\)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      ops.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    if (match[0].startsWith('@yield')) {
      ops.push({
        type: 'yield',
        name: match[1]!,
        defaultValue: match[2],
      });
    } else if (match[0].startsWith('@stack')) {
      ops.push({
        type: 'stack',
        name: match[3]!,
        defaultValue: match[4],
      });
    } else if (match[0].startsWith('@include')) {
      ops.push({
        type: 'include',
        name: match[5]!,
        dataExpression: match[6]?.trim(),
      });
    } else {
      ops.push({
        type: 'component',
        name: match[7]!,
        dataExpression: match[8]?.trim(),
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    ops.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return ops;
}

export function compileInlineEchoes(source: string): TemplateOp[] {
  const ops: TemplateOp[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(`${ECHO_RE.source}|${RAW_ECHO_RE.source}`, 'g');
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      appendText(ops, source.slice(lastIndex, match.index));
    }

    const raw = match[0].startsWith('{!!');
    const expression = match[1] ?? '';
    ops.push({ type: 'echo', expression, raw });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < source.length) {
    appendText(ops, source.slice(lastIndex));
  }

  return ops;
}