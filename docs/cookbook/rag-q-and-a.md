# RAG Q&A endpoint

Build a minimal retrieval-augmented Q&A flow with `@tyravel/rag` and `@tyravel/vector`.

## Scaffold

```bash
tyravel new knowledge-base --ai
npm install
tyravel vector:install
```

The `--ai` flag adds vector config, embed jobs, models, and example routes.

## Ingest documents

```typescript
import { ingestFile } from '@tyravel/rag';

await ingestFile('storage/docs/handbook.pdf', {
  source: 'handbook',
  chunkSize: 800,
});
```

Embed chunks:

```bash
tyravel vector:embed
```

## Ask endpoint

```typescript
import { Route } from '@tyravel/core';
import { Response } from '@tyravel/http';
import { retrieveAndAnswer } from '@tyravel/rag';

Route.post('/api/ask', async (request) => {
  const { question } = await request.json();
  const answer = await retrieveAndAnswer(question, { topK: 5 });
  return Response.json(answer);
});
```

Use your preferred LLM SDK in the app layer — Tyravel handles storage, retrieval, and prompt templates.

## Example app

See [`examples/rag`](https://github.com/thesimonharms/tyravel/tree/main/examples/rag) for ingest → embed → ask → stream with GraphQL read API.