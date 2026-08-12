/**
 * Static primer for coding agents — how Pondoknusa apps are supposed to work.
 * Kept free of app-specific discovery so it is useful on a fresh `pondoknusa new`.
 */
export function frameworkPrimerMarkdown(): string {
  return `# How Pondoknusa works

Pondoknusa is a TypeScript-native, Laravel-shaped web framework on standard Web APIs. Runtime requires **Node.js ≥ 26**.

## Project layout

- \`src/main.ts\` — boot the \`Application\`, register providers, import routes, start the HTTP server
- \`config/\` — typed config modules (\`app\`, \`database\`, \`queue\`, \`auth\`, …)
- \`src/routes/\` — route definitions (\`web.ts\` / \`api.ts\`, plus \`auth.ts\` after auth install)
- \`src/models/\` — Eloquent-style models
- \`src/providers/\` — service providers
- \`database/migrations/\` — timestamped migrations
- \`resources/views/\` — \`.tyr\` templates (omit in headless mode)
- \`storage/\` — logs, caches, compiled views (writable)
- \`.env\` — secrets and environment (\`APP_KEY\` required, ≥ 16 characters)

## Canonical workflow

\`\`\`bash
pondoknusa new my-app          # create-and-breathe scaffold
cd my-app
pondoknusa dev                 # hot reload (prefer over serve)
pondoknusa migrate             # run pending migrations
pondoknusa make:model Post --migration
pondoknusa make:controller PostsController
pondoknusa test
pondoknusa doctor              # preflight before deploy
pondoknusa deploy:check        # doctor + route/config/view validation
\`\`\`

## Mental model (Laravel-shaped)

Prefer framework facades and packages over reinventing infrastructure:

- **HTTP:** \`Route\`, middleware, form requests, API resources
- **Data:** \`DB\`, models, migrations, seeders, factories
- **Async:** \`Queue\`, jobs, \`pondoknusa queue:work\` / \`dev --queue\`
- **Auth:** session + API token guards after \`auth:install\`
- **Cache / mail / notifications / storage** via \`@pondoknusa/*\` packages

## Auth

- \`pondoknusa new\` with auth enabled (default) runs \`auth:install\` for you
- Full-stack: session login routes + Bearer API tokens
- Headless: API-prefixed auth routes under \`/api/v1\`
- Optional: \`pondoknusa oauth:install\`, \`pondoknusa crypto:install\`

## Headless vs full

- \`--headless\` / \`--template=headless\` — backend-only API, no views/Echo, \`mode: headless\`
- Full stack — \`.tyr\` views, optional SSR/SaaS templates

## Debugging

- \`pondoknusa debug:install\` — debug bar + \`/__debug\` timeline
- \`pondoknusa debug:watch\` — tail persisted entries **without** auth
- \`/__debug\` JSON requires an **authenticated** session

## Agent tooling (MCP)

- \`pondoknusa mcp:serve\` — stdio MCP server (routes, models, config, commands, docs, primer)
- \`pondoknusa mcp:install\` — writes \`.cursor/mcp.json\` + agent rules (\`AGENTS.md\`, Cursor rules)
- Use \`pondoknusa.primer\` to re-read this guidance inside MCP clients

## Safety

- Never commit \`.env\` or print secrets from config
- Sensitive config keys are redacted by the MCP config tool
`;
}
