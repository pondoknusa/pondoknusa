import type { ChannelAuthorizer } from './types.js';

export class ChannelRegistry {
  private readonly channels = new Map<string, ChannelAuthorizer>();

  register(pattern: string, authorizer: ChannelAuthorizer): this {
    this.channels.set(pattern, authorizer);
    return this;
  }

  authorize(channelName: string, user: unknown): Promise<boolean> {
    const authorizer = this.resolve(channelName);
    if (!authorizer) {
      return Promise.resolve(false);
    }

    const params = this.extractParams(channelName);
    return Promise.resolve(authorizer(user, ...params));
  }

  private resolve(channelName: string): ChannelAuthorizer | undefined {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    for (const [pattern, authorizer] of this.channels.entries()) {
      if (pattern.includes('{')) {
        const regex = patternToRegex(pattern);
        if (regex.test(channelName)) {
          return authorizer;
        }
      }
    }

    return undefined;
  }

  private extractParams(channelName: string): string[] {
    for (const pattern of this.channels.keys()) {
      if (!pattern.includes('{')) {
        continue;
      }
      const regex = patternToRegex(pattern);
      const match = channelName.match(regex);
      if (match) {
        return match.slice(1);
      }
    }
    return [];
  }
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\{[^}]+\\\}/g, '([^:]+)');
  return new RegExp(`^${escaped}$`);
}