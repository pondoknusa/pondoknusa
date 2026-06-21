import { describe, expect, it } from 'vitest';
import {
  encodeJsonForHtml,
  renderCsrfField,
  renderMethodField,
  switchMatches,
} from './form-helpers.js';

describe('form helpers', () => {
  it('renders csrf and method fields', () => {
    expect(renderCsrfField('abc')).toContain('name="_token"');
    expect(renderCsrfField('abc')).toContain('value="abc"');
    expect(renderMethodField('PUT')).toContain('name="_method"');
    expect(renderMethodField('POST')).toBe('');
  });

  it('encodes json safely for script embedding', () => {
    expect(encodeJsonForHtml({ ok: true })).toBe('{"ok":true}');
    expect(encodeJsonForHtml('</script>')).not.toContain('</script>');
  });

  it('matches switch cases with loose equality', () => {
    expect(switchMatches('1', 1)).toBe(true);
    expect(switchMatches('a', 'b')).toBe(false);
  });
});