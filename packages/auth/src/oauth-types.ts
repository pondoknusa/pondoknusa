export interface OAuthUserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  /** Whether the provider has verified ownership of `email`. */
  emailVerified?: boolean;
}