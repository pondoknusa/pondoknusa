import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { ViewEngine } from './view-engine.js';

function createFixture(): { basePath: string; engine: ViewEngine } {
  const basePath = join(tmpdir(), `tyravel-views-${Date.now()}-${Math.random()}`);
  const viewsPath = join(basePath, 'resources/views');
  mkdirSync(join(viewsPath, 'layouts'), { recursive: true });
  mkdirSync(join(viewsPath, 'components'), { recursive: true });

  writeFileSync(
    join(viewsPath, 'layouts/app.tyr'),
    `<!DOCTYPE html>
<html>
<head><title>@yield('title', 'Tyravel')</title></head>
<body>
  @yield('content')
</body>
</html>
`,
  );

  writeFileSync(
    join(viewsPath, 'welcome.tyr'),
    `@layout('layouts.app')

@section('title')
  Welcome
@endsection

@section('content')
  <h1>Hello {{ name }}</h1>
  @if (showDetails)
    <p>Users: {{ users.length }}</p>
  @endif
  <ul>
  @foreach (users as user)
    <li>{{ user }}</li>
  @endforeach
  </ul>
  @component('components.alert', { message: greeting })
@endsection
`,
  );

  writeFileSync(
    join(viewsPath, 'components/alert.tyr'),
    `<div class="alert">{{ message }}</div>`,
  );

  const engine = new ViewEngine(basePath, { path: 'resources/views' });
  return { basePath, engine };
}

describe('ViewEngine', () => {
  it('renders layouts, sections, control flow, and components', async () => {
    const { engine } = createFixture();

    const html = await engine.render('welcome', {
      name: 'Ada',
      showDetails: true,
      users: ['Grace', 'Alan'],
      greeting: 'Welcome back',
    });

    expect(html).toMatch(/<title>\s*Welcome\s*<\/title>/);
    expect(html).toContain('<h1>Hello Ada</h1>');
    expect(html).toContain('<p>Users: 2</p>');
    expect(html).toContain('<li>Grace</li>');
    expect(html).toContain('<div class="alert">Welcome back</div>');
  });

  it('escapes echoed values by default', async () => {
    const { basePath, engine } = createFixture();
    writeFileSync(
      join(basePath, 'resources/views/unsafe.tyr'),
      `<p>{{ payload }}</p>`,
    );

    const html = await engine.render('unsafe', {
      payload: '<script>alert(1)</script>',
    });

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});