import { describe, expect, it } from 'vitest';
import { TyravelRequest } from '@tyravel/http';
import { validateRequest, ValidationException, Validator } from './validator.js';

describe('Validator', () => {
  it('validates required and email rules', () => {
    const result = new Validator(
      { email: 'user@example.com', name: 'Tyravel' },
      { email: 'required|email', name: 'required|max_length:50' },
    ).validate();

    expect(result.email).toBe('user@example.com');
  });

  it('throws a validation exception with field errors', () => {
    expect(() =>
      new Validator({ email: 'invalid' }, { email: 'required|email' }).validate(),
    ).toThrow(ValidationException);
  });

  it('validates json request bodies', async () => {
    const request = new TyravelRequest(
      new Request('http://localhost/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', age: 21 }),
      }),
    );

    const data = await validateRequest(request, {
      email: 'required|email',
      age: 'required|integer|min:18',
    });

    expect(data).toEqual({ email: 'user@example.com', age: 21 });
  });
});