import { parentPort, workerData } from 'node:worker_threads';
import { compile, type CompileOptions } from './compiler.js';

interface WorkerRequest {
  source: string;
  options: CompileOptions;
}

interface WorkerPayload {
  workerData: WorkerRequest;
}

const payload = workerData as WorkerPayload['workerData'];

try {
  const template = compile(payload.source, payload.options);
  parentPort?.postMessage({ ok: true as const, template });
} catch (error) {
  parentPort?.postMessage({
    ok: false as const,
    error: error instanceof Error ? error.message : String(error),
  });
}