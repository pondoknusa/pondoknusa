/**
 * @pondoknusa/auth-passkey — Errors.
 */

export class PasskeyError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'not_supported'
      | 'challenge_invalid'
      | 'challenge_expired'
      | 'origin_mismatch'
      | 'rp_id_mismatch'
      | 'type_mismatch'
      | 'user_mismatch'
      | 'credential_unknown'
      | 'credential_exists'
      | 'counter_invalid'
      | 'signature_invalid'
      | 'user_not_present'
      | 'user_not_verified'
      | 'attestation_unsupported'
      | 'algorithm_unsupported'
      | 'malformed' = 'malformed',
  ) {
    super(message);
    this.name = 'PasskeyError';
  }
}
