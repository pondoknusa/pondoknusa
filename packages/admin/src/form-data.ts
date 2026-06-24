import type { TyravelRequest } from '@tyravel/http';
import type { AdminField } from './types.js';
import { parseAdminInputWithFiles, type StorageLike } from './file-upload.js';

export async function parseAdminInput(
  request: TyravelRequest,
  fields: AdminField[],
  storage?: StorageLike,
): Promise<Record<string, unknown>> {
  return parseAdminInputWithFiles(request, fields, storage);
}

export function parseBulkIds(request: TyravelRequest, body?: Record<string, unknown>): number[] {
  const fromQuery = request.query('ids');
  if (fromQuery) {
    return fromQuery.split(',').map(Number).filter(Number.isFinite);
  }

  const raw = body?.['ids[]'] ?? body?.ids;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(Number).filter(Number.isFinite);
}