import type { Embedding, VectorMetric } from './types.js';

export function cosineDistance(left: Embedding, right: Embedding): number {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let i = 0; i < left.length; i++) {
    const a = left[i] ?? 0;
    const b = right[i] ?? 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 1;
  }

  return 1 - dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function l2Distance(left: Embedding, right: Embedding): number {
  let sum = 0;
  for (let i = 0; i < left.length; i++) {
    const delta = (left[i] ?? 0) - (right[i] ?? 0);
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

export function innerProductDistance(left: Embedding, right: Embedding): number {
  let dot = 0;
  for (let i = 0; i < left.length; i++) {
    dot += (left[i] ?? 0) * (right[i] ?? 0);
  }
  return -dot;
}

export function vectorDistance(
  left: Embedding,
  right: Embedding,
  metric: VectorMetric = 'cosine',
): number {
  switch (metric) {
    case 'l2':
      return l2Distance(left, right);
    case 'inner_product':
      return innerProductDistance(left, right);
    default:
      return cosineDistance(left, right);
  }
}

export function distanceToScore(distance: number, metric: VectorMetric = 'cosine'): number {
  if (metric === 'cosine') {
    return Math.max(0, 1 - distance);
  }
  if (metric === 'inner_product') {
    return Math.max(0, -distance);
  }
  return 1 / (1 + distance);
}