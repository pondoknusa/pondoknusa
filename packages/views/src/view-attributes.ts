import { escapeHtml } from './escape.js';
import { mergeClassNames, mergeStyleStrings } from './component-helpers.js';

export class ViewAttributeBag {
  constructor(private readonly attributes: Record<string, unknown> = {}) {}

  get(key: string): unknown {
    return this.attributes[key];
  }

  all(): Record<string, unknown> {
    return { ...this.attributes };
  }

  only(keys: string[]): ViewAttributeBag {
    const filtered: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in this.attributes) {
        filtered[key] = this.attributes[key];
      }
    }
    return new ViewAttributeBag(filtered);
  }

  except(keys: string[]): ViewAttributeBag {
    const excluded = new Set(keys);
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(this.attributes)) {
      if (!excluded.has(key)) {
        filtered[key] = value;
      }
    }
    return new ViewAttributeBag(filtered);
  }

  merge(values: Record<string, unknown>): ViewAttributeBag {
    const merged = { ...this.attributes };

    for (const [key, value] of Object.entries(values)) {
      if (key === 'class') {
        merged.class = mergeClassNames(merged.class, value);
        continue;
      }

      if (key === 'style') {
        merged.style = mergeStyleStrings(String(merged.style ?? ''), value);
        continue;
      }

      merged[key] = value;
    }

    return new ViewAttributeBag(merged);
  }

  toHtml(): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(this.attributes)) {
      if (value === false || value === null || value === undefined) {
        continue;
      }

      if (value === true) {
        parts.push(key);
        continue;
      }

      parts.push(`${key}="${escapeHtml(String(value))}"`);
    }

    return parts.join(' ');
  }

  mergeIntoRootElement(html: string, extra?: Record<string, unknown>): string {
    const bag = extra ? this.merge(extra) : this;
    const rendered = bag.toHtml();
    if (!rendered) {
      return html;
    }

    const match = html.match(/^(\s*)<([A-Za-z][\w:-]*)([^>]*)(\/?>)/);
    if (!match) {
      return html;
    }

    const [, indent, tag, existingAttrs, closing] = match;
    const mergedAttrs = mergeAttributeStrings(existingAttrs ?? '', rendered);
    return `${indent}<${tag}${mergedAttrs}${closing}${html.slice(match[0].length)}`;
  }

  toString(): string {
    return this.toHtml();
  }
}

function mergeAttributeStrings(existing: string, incoming: string): string {
  if (!existing.trim()) {
    return incoming ? ` ${incoming}` : '';
  }
  if (!incoming.trim()) {
    return existing;
  }
  return `${existing} ${incoming}`;
}