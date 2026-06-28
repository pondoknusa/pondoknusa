# Tyravel `.tyr` language server (basic)

Stdio LSP for Tyravel templates. Provides:

- Completion for `@include`, `@component`, and `@layout` view paths
- Prop name completion from `types/view-props.generated.d.ts` (run `tyravel view:types` first)
- Go-to-definition for referenced view paths

## Install

```bash
cd tools/tyr-lsp
npm install
```

## VS Code / Cursor

Add to `.vscode/settings.json` in your Tyravel app:

```json
{
  "tyravel.languageServerPath": "../tyravel/tools/tyr-lsp/server.mjs"
}
```

Or configure the [Tyravel extension stub](../vscode-tyravel/README.md) and point your editor's LSP client at:

```bash
node /path/to/tyravel/tools/tyr-lsp/server.mjs
```

## Scope

This is a Tier 18 starter LSP — not a full Blade-class language server. It validates `@include` paths by filesystem lookup and reads generated `ViewPropsMap` types for completions.