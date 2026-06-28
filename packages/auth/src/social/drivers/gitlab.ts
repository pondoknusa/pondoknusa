import type { OAuthProviderConfig } from '../../types.js';
import type { OAuthUserProfile } from '../../oauth-types.js';
import type { OAuthAuthorizeContext, OAuthExchangeContext, SocialOAuthDriver } from '../types.js';
import { appendPkceParams, exchangeAuthorizationCode } from '../http.js';

const DEFAULT_GITLAB_BASE_URL = 'https://gitlab.com';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export class GitlabOAuthDriver implements SocialOAuthDriver {
  readonly name = 'gitlab';
  readonly usesPkce = true;

  constructor(private readonly config: OAuthProviderConfig) {}

  private get baseUrl(): string {
    return normalizeBaseUrl(this.config.baseUrl ?? DEFAULT_GITLAB_BASE_URL);
  }

  authorizationUrl(state: string, context?: OAuthAuthorizeContext): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: (this.config.scopes ?? ['read_user']).join(' '),
      state,
    });
    appendPkceParams(params, context);
    return `${this.baseUrl}/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string, context?: OAuthExchangeContext): Promise<OAuthUserProfile> {
    const accessToken = await exchangeAuthorizationCode({
      tokenUrl: `${this.baseUrl}/oauth/token`,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      code,
      redirectUri: this.config.redirectUri,
      codeVerifier: context?.codeVerifier,
    });

    const userRes = await fetch(`${this.baseUrl}/api/v4/user`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const user = (await userRes.json()) as {
      id: number;
      email?: string | null;
      name?: string | null;
      username?: string;
      avatar_url?: string | null;
    };

    return {
      id: String(user.id),
      email: user.email ?? null,
      name: user.name ?? user.username ?? null,
      avatar: user.avatar_url ?? null,
    };
  }
}