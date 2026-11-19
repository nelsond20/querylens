import { FieldDefinition } from '../datasets/field-definition.model';

export type BucketUnit = 'day' | 'week' | 'month';

export interface TimelineBucket {
  start: number;
  label: string;
  total: number;
  matched: number;
}

export interface Timeline {
  field: string;
  unit: BucketUnit;
  buckets: TimelineBucket[];
}

export interface BreakdownSlice {
  label: string;
  count: number;
  pct: number;
}

export interface Breakdown {
  field: string;
  slices: BreakdownSlice[];
  candidates: string[];
}

type Row = Record<string, unknown>;

const MIN_CATEGORIES = 2;
const MAX_CATEGORIES = 12;
const MAX_SLICES = 6;
const DAY_MS = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

/** String fields with 2–12 distinct non-empty values across the whole dataset, in field order. */
export function eligibleCategoryFields(fields: FieldDefinition[], rows: Row[]): string[] {
  const candidates = fields.filter((f) => f.type === 'string').map((f) => f.key);
  const seen = new Map<string, Set<unknown>>(candidates.map((key) => [key, new Set()]));
  const open = new Set(candidates);

  for (const row of rows) {
    if (open.size === 0) {
      break;
    }
    for (const key of open) {
      const value = row[key];
      if (!isPresent(value)) {
        continue;
      }
      const set = seen.get(key)!;
      set.add(value);
      if (set.size > MAX_CATEGORIES) {
        open.delete(key);
      }
    }
  }

  return candidates.filter((key) => {
    const size = seen.get(key)!.size;
    return size >= MIN_CATEGORIES && size <= MAX_CATEGORIES;
  });
}

function countValues(results: Row[], field: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of results) {
    const value = row[field];
    if (!isPresent(value)) {
      continue;
    }
    const label = String(value);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return counts;
}

/** Distribution of the current results over a categorical field, or null if nothing varies. */
export function buildBreakdown(eligible: string[], results: Row[], field?: string): Breakdown | null {
  const countsByField = new Map(eligible.map((key) => [key, countValues(results, key)]));
  const candidates = eligible.filter((key) => countsByField.get(key)!.size >= MIN_CATEGORIES);
  if (candidates.length === 0) {
    return null;
  }

  const chosen = field && candidates.includes(field) ? field : candidates[0];
  const counts = [...countsByField.get(chosen)!.entries()].sort((a, b) => b[1] - a[1]);
  const total = counts.reduce((sum, [, count]) => sum + count, 0);

  let entries = counts;
  if (counts.length > MAX_SLICES) {
    const rest = counts.slice(MAX_SLICES - 1).reduce((sum, [, count]) => sum + count, 0);
    entries = [...counts.slice(0, MAX_SLICES - 1), ['Other', rest]];
  }

  return {
    field: chosen,
    candidates,
    slices: entries.map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) })),
  };
}

function bucketStart(ms: number, unit: BucketUnit): number {
  if (unit === 'month') {
    const d = new Date(ms);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  }
  const epochDay = Math.floor(ms / DAY_MS);
  if (unit === 'day') {
    return epochDay * DAY_MS;
  }
  // 1970-01-01 was a Thursday, so (epochDay + 3) % 7 is days since Monday.
  const sinceMonday = (((epochDay + 3) % 7) + 7) % 7;
  return (epochDay - sinceMonday) * DAY_MS;
}

function nextBucket(start: number, unit: BucketUnit): number {
  if (unit === 'day') {
    return start + DAY_MS;
  }
  if (unit === 'week') {
    return start + 7 * DAY_MS;
  }
  const d = new Date(start);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}

function bucketLabel(start: number, unit: BucketUnit): string {
  const d = new Date(start);
  const dayMonth = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  if (unit === 'day') {
    return dayMonth;
  }
  if (unit === 'week') {
    return `Week of ${dayMonth}`;
  }
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function parseDate(value: unknown): number | null {
  if (!isPresent(value)) {
    return null;
  }
  const ms = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(ms) ? ms : null;
}

interface TimelineIndex {
  unit: BucketUnit;
  parsed: Map<Row, number>;
  indexByStart: Map<number, number>;
  buckets: TimelineBucket[];
}

// A dataset's rows array is stable between queries, so its parsed dates and totals are computed once.
const indexCache = new WeakMap<Row[], Map<string, TimelineIndex | null>>();

function timelineIndex(allRows: Row[], field: string): TimelineIndex | null {
  let byField = indexCache.get(allRows);
  if (!byField) {
    byField = new Map();
    indexCache.set(allRows, byField);
  }
  if (!byField.has(field)) {
    byField.set(field, computeTimelineIndex(allRows, field));
  }
  return byField.get(field)!;
}

function computeTimelineIndex(allRows: Row[], field: string): TimelineIndex | null {
  // Results are usually the same row objects as allRows, so each row is parsed once.
  const parsed = new Map<Row, number>();
  let min = Infinity;
  let max = -Infinity;
  for (const row of allRows) {
    const ms = parseDate(row[field]);
    if (ms === null) {
      continue;
    }
    parsed.set(row, ms);
    if (ms < min) min = ms;
    if (ms > max) max = ms;
  }
  if (parsed.size < 2) {
    return null;
  }

  const rangeDays = (max - min) / DAY_MS;
  const unit: BucketUnit = rangeDays <= 60 ? 'day' : rangeDays <= 420 ? 'week' : 'month';

  const buckets: TimelineBucket[] = [];
  const indexByStart = new Map<number, number>();
  for (let start = bucketStart(min, unit); start <= max; start = nextBucket(start, unit)) {
    indexByStart.set(start, buckets.length);
    buckets.push({ start, label: bucketLabel(start, unit), total: 0, matched: 0 });
  }
  for (const ms of parsed.values()) {
    buckets[indexByStart.get(bucketStart(ms, unit))!].total++;
  }

  return { unit, parsed, indexByStart, buckets };
}

/** Rows per time bucket for the current results against the whole dataset. */
export function buildTimeline(fields: FieldDefinition[], allRows: Row[], results: Row[]): Timeline | null {
  const dateField = fields.find((f) => f.type === 'date');
  if (!dateField) {
    return null;
  }
  const field = dateField.key;
  const index = timelineIndex(allRows, field);
  if (!index) {
    return null;
  }

  const { unit, parsed, indexByStart } = index;
  const buckets = index.buckets.map((b) => ({ ...b, matched: 0 }));
  for (const row of results) {
    const ms = parsed.has(row) ? parsed.get(row)! : parseDate(row[field]);
    if (ms === null) {
      continue;
    }
    const slot = indexByStart.get(bucketStart(ms, unit));
    if (slot !== undefined) {
      buckets[slot].matched++;
    }
  }

  return { field, unit, buckets };
}
