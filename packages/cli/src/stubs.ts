export function projectPackageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      private: true,
      type: 'module',
      scripts: {
        dev: 'tyravel serve',
        start: 'tyravel serve',
      },
      dependencies: {
        '@tyravel/config': '^0.0.1',
        '@tyravel/core': '^0.0.1',
        '@tyravel/database': '^0.0.1',
        '@tyravel/http': '^0.0.1',
        '@tyravel/queue': '^0.0.1',
        '@tyravel/validation': '^0.0.1',
        '@tyravel/views': '^0.0.1',
      },
      devDependencies: {
        '@tyravel/cli': '^0.0.1',
      },
    },
    null,
    2,
  );
}

export function projectConfig(name: string): string {
  return JSON.stringify(
    {
      name,
      entry: 'src/main.ts',
      serve: {
        port: 3000,
        hostname: '127.0.0.1',
      },
    },
    null,
    2,
  );
}

export function mainEntry(): string {
  return `import {
  Application,
  ConfigServiceProvider,
  DatabaseServiceProvider,
  HttpKernel,
  QueueServiceProvider,
  setQueueApplication,
  setRouteApplication,
  setViewApplication,
  ViewServiceProvider,
  serve,
} from '@tyravel/core';
import { AppServiceProvider } from './providers/app-service-provider.js';
import './routes/web.js';

const app = new Application(import.meta.dir);
setRouteApplication(app);
setViewApplication(app);
setQueueApplication(app);

app.register(ConfigServiceProvider);
app.register(DatabaseServiceProvider);
app.register(QueueServiceProvider);
app.register(ViewServiceProvider);
app.register(AppServiceProvider);

await app.boot();

const kernel = new HttpKernel(app);
await serve(kernel);
`;
}

export function appConfig(name: string): string {
  return `export default {
  name: '${name}',
  debug: true,
} as const;
`;
}

export function viewsConfig(): string {
  return `export default {
  path: 'resources/views',
  extension: '.tyr',
} as const;
`;
}

export function databaseConfig(): string {
  return `export default {
  default: 'sqlite',
  connections: {
    sqlite: {
      driver: 'sqlite',
      database: 'database/database.sqlite',
    },
    postgres: {
      driver: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      database: 'tyravel',
      username: 'postgres',
      password: '',
    },
    mysql: {
      driver: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      database: 'tyravel',
      username: 'root',
      password: '',
    },
  },
} as const;
`;
}

export function appServiceProvider(): string {
  return `import { ServiceProvider } from '@tyravel/core';

export class AppServiceProvider extends ServiceProvider {
  override register() {
    this.app.instance('app.name', 'Tyravel');
  }
}
`;
}

export function webRoutes(): string {
  return `import { Route } from '@tyravel/core';
import { Response } from '@tyravel/http';

Route.get('/', (request) =>
  Response.json({
    message: 'Welcome to Tyravel',
    path: request.path,
  }),
);
`;
}

export function controller(name: string): string {
  const className = `${name}Controller`;

  return `import type { TyravelRequest } from '@tyravel/http';
import { Response } from '@tyravel/http';

export class ${className} {
  index(_request: TyravelRequest) {
    return Response.json({
      message: '${className}@index',
    });
  }

  show(request: TyravelRequest) {
    return Response.json({
      message: '${className}@show',
      id: request.param('id'),
    });
  }
}
`;
}

export function model(name: string): string {
  const table = `${name.charAt(0).toLowerCase()}${name.slice(1)}s`;

  return `import { Model } from '@tyravel/database';

export interface ${name}Attributes {
  id: number;
}

export class ${name} extends Model<${name}Attributes> {
  static override table = '${table}';
}
`;
}

export function migration(className: string): string {
  return `import { Migration } from '@tyravel/database';
import type { DatabaseConnection } from '@tyravel/database';
import type { SchemaBuilder } from '@tyravel/database';

export default class ${className} extends Migration {
  override async up(_connection: DatabaseConnection, schema: SchemaBuilder) {
    //
  }

  override async down(_connection: DatabaseConnection, schema: SchemaBuilder) {
    //
  }
}
`;
}

export function view(name: string): string {
  return `@layout('layouts.app')

@section('title')
  ${name}
@endsection

@section('content')
  <h1>${name}</h1>
@endsection
`;
}

export function layoutView(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>@yield('title', 'Tyravel')</title>
</head>
<body>
  @yield('content')
</body>
</html>
`;
}

export function provider(name: string): string {
  const className = `${name}ServiceProvider`;

  return `import { ServiceProvider } from '@tyravel/core';

export class ${className} extends ServiceProvider {
  override register() {
    //
  }

  override boot() {
    //
  }
}
`;
}

export function job(name: string): string {
  return `import { Job } from '@tyravel/queue';

export interface ${name}Payload {
  //
}

export class ${name} extends Job<${name}Payload> {
  override async handle(): Promise<void> {
    //
  }
}
`;
}

export function queueConfig(): string {
  return `export default {
  default: 'sync',
  connections: {
    sync: { driver: 'sync' },
    database: {
      driver: 'database',
      table: 'jobs',
      connection: 'sqlite',
      retryAfter: 90,
    },
  },
} as const;
`;
}

export function jobsTableMigration(): string {
  return `import { Migration } from '@tyravel/database';
import type { DatabaseConnection } from '@tyravel/database';
import type { SchemaBuilder } from '@tyravel/database';

export default class CreateJobsTable extends Migration {
  override async up(_connection: DatabaseConnection, schema: SchemaBuilder) {
    await schema.create('jobs', (table) => {
      table.id();
      table.string('queue');
      table.text('payload');
      table.integer('attempts');
      table.integer('reserved_at').nullable();
      table.integer('available_at');
      table.integer('created_at');
    });
  }

  override async down(_connection: DatabaseConnection, schema: SchemaBuilder) {
    await schema.drop('jobs');
  }
}
`;
}