import type { OAuthProviderConfig } from '../../types.js';
import type { OAuthUserProfile } from '../../oauth-types.js';
import type { OAuthAuthorizeContext, OAuthExchangeContext, SocialOAuthDriver } from '../types.js';
import { appendPkceParams, exchangeAuthorizationCode } from '../http.js';

export class GithubOAuthDriver implements SocialOAuthDriver {
  readonly name = 'github';
  readonly usesPkce = true;

  constructor(private readonly config: OAuthProviderConfig) {}

  authorizationUrl(state: string, context?: OAuthAuthorizeContext): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: (this.config.scopes ?? ['user:email']).join(' '),
      state,
    });
    appendPkceParams(params, context);
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string, context?: OAuthExchangeContext): Promise<OAuthUserProfile> {
    const accessToken = await exchangeAuthorizationCode({
      tokenUrl: 'https://github.com/login/oauth/access_token',
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      code,
      redirectUri: this.config.redirectUri,
      codeVerifier: context?.codeVerifier,
      headers: { accept: 'application/json' },
    });

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
        'user-agent': 'pondoknusa-auth',
      },
    });

    if (!userRes.ok) {
      throw new Error('GitHub user profile request failed.');
    }

    const user = (await userRes.json()) as {
      id: number;
      login?: string;
      email?: string | null;
      name?: string | null;
      avatar_url?: string | null;
    };

    const { email, emailVerified } = await resolveGithubEmail(accessToken, user.email);

    return {
      id: String(user.id),
      email,
      name: user.name ?? user.login ?? null,
      avatar: user.avatar_url ?? null,
      emailVerified,
    };
  }
}

/**
 * GitHub's `/user` email is frequently null or unverified. Resolve a verified
 * address from `/user/emails` so account linking only trusts addresses GitHub
 * has actually confirmed.
 */
async function resolveGithubEmail(
  accessToken: string,
  profileEmail: string | null | undefined,
): Promise<{ email: string | null; emailVerified: boolean }> {
  const emails = await fetchGithubEmails(accessToken);
  if (profileEmail) {
    const match = emails.find((entry) => entry.email === profileEmail);
    return { email: profileEmail, emailVerified: match?.verified === true };
  }

  const verified =
    emails.find((entry) => entry.primary === true && entry.verified === true)
    ?? emails.find((entry) => entry.verified === true);

  return {
    email: verified?.email ?? null,
    emailVerified: verified?.verified === true,
  };
}

async function fetchGithubEmails(
  accessToken: string,
): Promise<Array<{ email?: string; verified?: boolean; primary?: boolean }>> {
  try {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
        'user-agent': 'pondoknusa-auth',
      },
    });
    if (!emailsRes.ok) {
      return [];
    }
    return (await emailsRes.json()) as Array<{ email?: string; verified?: boolean; primary?: boolean }>;
  } catch {
    return [];
  }
}