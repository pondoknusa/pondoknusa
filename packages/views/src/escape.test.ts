import { describe, expect, it } from 'vitest';
import { escapeCss } from './escape.js';

describe('escapeCss', () => {
  it('escapes quotes and backslashes', () => {
    expect(escapeCss(`a"b'c\\d`)).toBe(`a\\"b\\'c\\\\d`);
  });

  it('neutralizes HTML-breaking characters to prevent </style> breakout', () => {
    const escaped = escapeCss(`</style><script>alert(1)</script>`);
    expect(escaped).not.toContain('</style>');
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });
});
