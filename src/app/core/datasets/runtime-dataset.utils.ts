import { Dataset } from './dataset.model';
import { FieldDefinition } from './field-definition.model';

type SourceType = Extract<Dataset['source'], 'file' | 'api'>;

export interface JsonRowExtractionOptions {
  maxRows?: number;
  maxTraversalNodes?: number;
  maxTraversalDepth?: number;
}

export const MAX_JSON_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_JSON_ROWS = 50000;
export const MAX_JSON_TRAVERSAL_NODES = 200000;
export const MAX_JSON_TRAVERSAL_DEPTH = 64;

export function createRuntimeDataset(params: {
  id: string;
  name: string;
  description: string;
  source: SourceType;
  rows: Record<string, unknown>[];
}): Dataset {
  const normalizedRows = normalizeRows(params.rows);
  const fields = inferFields(normalizedRows);
  const rows = coerceRowsByFields(normalizedRows, fields);

  return {
    id: params.id,
    name: params.name,
    description: params.description,
    source: params.source,
    fields,
    rows,
  };
}

export function parseJsonRows(input: string, options: JsonRowExtractionOptions = {}): Record<string, unknown>[] {
  const parsed = JSON.parse(input) as unknown;
  return extractRowsFromPayload(parsed, options);
}

export function extractRowsFromPayload(
  payload: unknown,
  options: JsonRowExtractionOptions = {},
): Record<string, unknown>[] {
  const maxRows = options.maxRows ?? MAX_JSON_ROWS;
  const maxTraversalNodes = options.maxTraversalNodes ?? MAX_JSON_TRAVERSAL_NODES;
  const maxTraversalDepth = options.maxTraversalDepth ?? MAX_JSON_TRAVERSAL_DEPTH;

  const stack: Array<{ value: unknown; depth: number }> = [{ value: payload, depth: 0 }];
  let visitedNodes = 0;
  let largest: Record<string, unknown>[] | null = null;

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    visitedNodes += 1;
    if (visitedNodes > maxTraversalNodes) {
      throw new Error('JSON payload is too complex to import safely');
    }

    if (current.depth > maxTraversalDepth) {
      throw new Error('JSON payload is too deeply nested to import safely');
    }

    if (Array.isArray(current.value)) {
      if (isObjectArray(current.value)) {
        if (!largest || current.value.length > largest.length) {
          largest = current.value;
        }
        continue;
      }

      if (current.depth === maxTraversalDepth) {
        continue;
      }

      for (let i = current.value.length - 1; i >= 0; i -= 1) {
        stack.push({ value: current.value[i], depth: current.depth + 1 });
      }

      continue;
    }

    if (!isRecord(current.value) || current.depth === maxTraversalDepth) {
      continue;
    }

    for (const value of Object.values(current.value)) {
      stack.push({ value, depth: current.depth + 1 });
    }
  }

  if (!largest) {
    throw new Error('JSON payload must contain an object array at any depth');
  }

  if (largest.length > maxRows) {
    throw new Error(`JSON dataset exceeds ${maxRows.toLocaleString()} rows limit`);
  }

  return largest;
}

export function parseCsvRows(input: string): Record<string, unknown>[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV needs a header row and at least one data row');
  }

  const headers = parseCsvLine(lines[0]).map((value) => value.trim());
  if (headers.some((header) => header.length === 0)) {
    throw new Error('CSV header contains an empty column name');
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, unknown> = {};

    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = values[i] ?? '';
    }

    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function normalizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const keySet = new Set<string>();

  for (const row of rows) {
    Object.keys(row).forEach((key) => keySet.add(key));
  }

  const keys = [...keySet];

  return rows.map((row) => {
    const normalized: Record<string, unknown> = {};

    for (const key of keys) {
      normalized[key] = normalizeValue(row[key]);
    }

    return normalized;
  });
}

function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
}

function inferFields(rows: Record<string, unknown>[]): FieldDefinition[] {
  if (rows.length === 0) {
    return [];
  }

  const keys = Object.keys(rows[0]);

  return keys.map((key) => {
    const values = rows.map((row) => row[key]);
    return {
      key,
      label: humanizeLabel(key),
      type: inferType(values),
    };
  });
}

function coerceRowsByFields(
  rows: Record<string, unknown>[],
  fields: FieldDefinition[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const typedRow: Record<string, unknown> = {};

    for (const field of fields) {
      typedRow[field.key] = coerceValue(row[field.key], field.type);
    }

    return typedRow;
  });
}

function inferType(values: unknown[]): FieldDefinition['type'] {
  const nonEmpty = values.filter((value) => value !== '' && value !== null && value !== undefined);

  if (nonEmpty.length === 0) {
    return 'string';
  }

  if (nonEmpty.every((value) => isBooleanValue(value))) {
    return 'boolean';
  }

  if (nonEmpty.every((value) => isNumericValue(value))) {
    return 'number';
  }

  if (nonEmpty.every((value) => isDateValue(value))) {
    return 'date';
  }

  return 'string';
}

function isBooleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.toLowerCase();
  return normalized === 'true' || normalized === 'false';
}

function isNumericValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return false;
  }

  return !Number.isNaN(Number(normalized));
}

function isDateValue(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();
  if (normalized.length < 8) {
    return false;
  }

  return !Number.isNaN(Date.parse(normalized));
}

function coerceValue(value: unknown, type: FieldDefinition['type']): unknown {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  if (type === 'number') {
    return typeof value === 'number' ? value : Number(value);
  }

  if (type === 'boolean') {
    if (typeof value === 'boolean') {
      return value;
    }
    return String(value).toLowerCase() === 'true';
  }

  if (type === 'date') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return value;
}

function humanizeLabel(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectArray(value: unknown[]): value is Record<string, unknown>[] {
  for (let i = 0; i < value.length; i += 1) {
    if (!isRecord(value[i])) {
      return false;
    }
  }
  return true;
}
