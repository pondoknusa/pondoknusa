#!/usr/bin/env node
import * as bench from './benchmark.mjs';

const name = process.argv[2];
if (!name) {
  console.error('Usage: bench-runner.mjs <function-name> [options-json]');
  process.exit(1);
}

const options = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const fn = bench[name];
if (typeof fn !== 'function') {
  console.error(`Unknown benchmark function: ${name}`);
  process.exit(1);
}

const result = await fn(options);
process.stdout.write(JSON.stringify(result));
