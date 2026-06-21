import { escapeHtml } from './escape.js';

export function renderCsrfField(token: string): string {
  return `<input type="hidden" name="_token" value="${escapeHtml(token)}">`;
}

export function renderMethodField(method: string): string {
  const verb = method.toUpperCase();
  if (verb === 'GET' || verb === 'POST') {
    return '';
  }
  return `<input type="hidden" name="_method" value="${escapeHtml(verb)}">`;
}

export function renderFormAttribute(attribute: string, active: boolean): string {
  return active ? attribute : '';
}

export function encodeJsonForHtml(value: unknown): string {
  const json = JSON.stringify(value ?? null);
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function switchMatches(switchValue: unknown, caseValue: unknown): boolean {
  return switchValue == caseValue;
}