import { Model } from '@tyravel/database';
import type { HasManyRelation, ModelQueryBuilder } from '@tyravel/database';
import { Post } from './post.js';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export class User extends Model<UserAttributes> {
  static override table = 'users';

  static scopeWithEmail(builder: ModelQueryBuilder, domain: string): ModelQueryBuilder {
    return builder.where('email', 'like', `%@${domain}`);
  }

  posts(): HasManyRelation<Post> {
    return this.hasMany(Post);
  }
}