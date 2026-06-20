export class AuthenticationException extends Error {
  constructor(message = 'Unauthenticated.') {
    super(message);
    this.name = 'AuthenticationException';
  }
}

export class InvalidCredentialsException extends Error {
  constructor(message = 'These credentials do not match our records.') {
    super(message);
    this.name = 'InvalidCredentialsException';
  }
}