# Tyravel RAG example

Minimal ingest → embed → ask flow. Embedding and LLM calls use your own SDK in the app layer (`src/embed.ts`); Tyravel handles chunking, storage, and retrieval.

```bash
npm install
cp .env.example .env
tyravel migrate
tyravel serve
```

In another terminal, embed ingested chunks and process the queue:

```bash
tyravel vector:embed --model=Document
tyravel queue:work
```

Then `POST /rag/ask` with `{ "question": "..." }` returns a grounded prompt plus retrieved chunks.

Ingest from a file path (`.txt`, `.md`, `.pdf`):

```bash
curl -X POST http://127.0.0.1:3000/rag/ingest \
  -H 'content-type: application/json' \
  -d '{"path":"./docs/guide/introduction.md"}'
```

Stream a grounded answer over SSE (replace the stub token stream with your SDK):

```bash
curl -N -X POST http://127.0.0.1:3000/rag/ask/stream \
  -H 'content-type: application/json' \
  -d '{"question":"How does broadcasting work?","sessionId":"demo-1"}'
```

Scaffold a new app with AI routes and vector config:

```bash
tyravel new my-ai-app --ai
```

Run the MCP server for agent tooling:

```bash
tyravel mcp:serve
```

Export Cursor / Claude agent rules from the capability manifest:

```bash
tyravel mcp:export-rules --format=cursor
tyravel mcp:export-rules --format=agents --output=AGENTS.md
```