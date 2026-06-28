# Performance benchmarks

Tyravel ships a small benchmark harness for baseline throughput on three hot paths: HTTP responses, ORM reads, and view compilation.

## Run locally

Build the workspace first, then:

```bash
npm run benchmark
```

JSON output for CI or dashboards:

```bash
npm run benchmark -- --json
```

Quick smoke mode (fewer samples):

```bash
BENCHMARK_QUICK=1 npm run benchmark
```

## What is measured

| Benchmark | What it exercises |
|-----------|-------------------|
| `http.json` | In-process `serve()` handling `GET /bench` JSON responses with concurrent `fetch` |
| `orm.select` | `Model.all()` against 100 seeded rows in SQLite `:memory:` |
| `view.compile` | Compiling `examples/hello-world/resources/views/welcome.tyr` |

Results are **informational baselines**, not competitive claims. Throughput varies with CPU, Node version, and concurrent load.

## Interpreting results

- **req/s** and **ops/s** are rounded integers derived from total samples divided by elapsed milliseconds.
- Compare runs on the same machine and Node version when tracking regressions.
- Use the observability cookbook for production latency and saturation signals — benchmarks do not replace real traffic profiling.

## Related

- [Deployment](/guide/deployment) — horizontal scaling and worker sizing
- [Observability cookbook](/cookbook/observability) — health probes, structured logs, queue failure signals
- [Testing](/guide/testing) — feature and integration coverage alongside perf baselines