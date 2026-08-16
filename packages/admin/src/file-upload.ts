import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { PondoknusaRequest } from '@pondoknusa/http';
import type { AdminField } from './types.js';

export interface StorageLike {
  put(path: string, contents: Buffer): Promise<void>;
  url(path: string): string;
}

const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function parseAdminInputWithFiles(
  request: PondoknusaRequest,
  fields: AdminField[],
  storage?: StorageLike,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    return parseScalarInput(request, fields, contentType);
  }

  const form = await request.formData();
  const attributes: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === 'file') {
      const uploaded = await uploadFieldFile(form, field, storage);
      if (uploaded !== undefined) {
        attributes[field.name] = uploaded;
      }
      continue;
    }

    const raw = form.get(field.name);
    if (raw === null) {
      continue;
    }

    attributes[field.name] = coerceScalar(field, raw);
  }

  return attributes;
}

async function parseScalarInput(
  request: PondoknusaRequest,
  fields: AdminField[],
  contentType: string,
): Promise<Record<string, unknown>> {
  let source: Record<string, unknown> = {};

  if (contentType.includes('application/json')) {
    source = (await request.json()) as Record<string, unknown>;
  } else {
    const form = await request.formData();
    form.forEach((value, key) => {
      if (typeof value === 'string') {
        source[key] = value;
      }
    });
  }

  const attributes: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === 'file' || !(field.name in source)) {
      continue;
    }
    attributes[field.name] = coerceScalar(field, source[field.name]);
  }

  return attributes;
}

async function uploadFieldFile(
  form: FormData,
  field: AdminField,
  storage?: StorageLike,
): Promise<string | undefined> {
  const raw = form.get(field.name);
  if (!(raw instanceof File) || raw.size === 0) {
    return undefined;
  }

  if (!storage) {
    throw new Error(`Storage is not configured for admin file field [${field.name}].`);
  }

  const maxBytes = field.file?.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;
  if (raw.size > maxBytes) {
    throw new Error(
      `Uploaded file for [${field.name}] exceeds the maximum size of ${maxBytes} bytes.`,
    );
  }

  const extension = normalizeExtension(extname(raw.name));
  const allowedExtensions = field.file?.allowedExtensions?.map(normalizeExtension);
  if (allowedExtensions && allowedExtensions.length > 0) {
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new Error(
        `Uploaded file for [${field.name}] has a disallowed extension [${extension || '(none)'}].`,
      );
    }
  }

  const allowedMimeTypes = field.file?.allowedMimeTypes;
  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    const mime = (raw.type || '').toLowerCase();
    if (!mime || !allowedMimeTypes.map((entry) => entry.toLowerCase()).includes(mime)) {
      throw new Error(
        `Uploaded file for [${field.name}] has a disallowed content type [${mime || '(none)'}].`,
      );
    }
  }

  const directory = field.file?.directory ?? field.name;
  const filename = `${randomUUID()}${extension}`;
  const path = `${directory.replace(/\/$/, '')}/${filename}`;
  const buffer = Buffer.from(await raw.arrayBuffer());
  await storage.put(path, buffer);
  return storage.url(path);
}

function normalizeExtension(extension: string): string {
  if (!extension) {
    return '';
  }
  const lower = extension.toLowerCase();
  return lower.startsWith('.') ? lower : `.${lower}`;
}

function coerceScalar(field: AdminField, raw: unknown): unknown {
  if (field.type === 'boolean') {
    return raw === '1' || raw === 'true' || raw === true || raw === 'on';
  }

  if (field.type === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }

  if (field.type === 'datetime' && typeof raw === 'string') {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString();
  }

  if (field.type === 'json' && typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  return raw;
}
