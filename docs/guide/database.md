# Database & ORM

Register `DatabaseServiceProvider` and configure `config/database.ts`:

```typescript
export default {
  default: 'sqlite',
  connections: {
    sqlite: { driver: 'sqlite', database: 'database/database.sqlite' },
    postgres: {
      driver: 'postgres',
      host: '127.0.0.1',
      database: 'pondoknusa',
      username: 'postgres',
      password: '',
    },
  },
} as const;
```

Optional drivers (register the matching service provider **before** `DatabaseServiceProvider`). Install the driver **and** `@pondoknusa/database` — drivers declare the ORM as a peer so `DatabaseManager.extend()` shares one registry with core:

| Driver | Package | Install |
|--------|---------|---------|
| `postgres` | `@pondoknusa/database-pg` | `npm install @pondoknusa/database-pg @pondoknusa/database` |
| `mysql` | `@pondoknusa/database-mysql` | `npm install @pondoknusa/database-mysql @pondoknusa/database` |
| `d1` | `@pondoknusa/database-d1` | `npm install @pondoknusa/database-d1 @pondoknusa/database` |

## Models

```typescript
export class User extends Model<UserAttributes> {
  static override table = 'users';

  static scopeActive(builder: ModelQueryBuilder) {
    return builder.where('active', 1);
  }
}

const users = await User.all();
const active = await User.scope('active').getModels();
const user = await User.find(1);
```

## Relationships

```typescript
const posts = await user.hasMany(Post).get();
const author = await post.belongsTo(User).get();
const roles = await user.belongsToMany(Role).get();
```

Eager-load to avoid N+1 queries:

```typescript
const users = await User.query().with('posts').getModels();
```

## Migrations

```bash
pondoknusa make:migration create_posts_table
pondoknusa migrate
```

```typescript
await schema.create('posts', (table) => {
  table.id();
  table.string('title');
  table.timestamps();
});
```

## Factories & seeders

```bash
pondoknusa make:factory Post
pondoknusa make:seeder DatabaseSeeder
pondoknusa db:seed
```

## Computed attributes

Whitelist accessors in JSON output:

```typescript
export class Post extends Model<PostAttributes> {
  static override appends = ['rendered_body'];

  get rendered_body(): string {
    return markdownToHtml(this.getAttribute('body') ?? '');
  }
}
```