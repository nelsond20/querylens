import { describe, expect, it } from 'vitest';
import { eventsDataset } from '../datasets/events.dataset';
import { productsDataset } from '../datasets/products.dataset';
import { usersDataset } from '../datasets/users.dataset';
import { FieldDefinition } from '../datasets/field-definition.model';
import { buildBreakdown, buildTimeline, eligibleCategoryFields } from './bento-data';

const typeField: FieldDefinition[] = [{ key: 'type', label: 'Type', type: 'string' }];
const rowsWithTypes = (types: unknown[]) => types.map((type) => ({ type }));

describe('eligibleCategoryFields', () => {
  it('picks low-cardinality string fields of the built-in datasets', () => {
    expect(eligibleCategoryFields(eventsDataset.fields, eventsDataset.rows)).toEqual(['type']);
    expect(eligibleCategoryFields(usersDataset.fields, usersDataset.rows)).toEqual(['role', 'status']);
    expect(eligibleCategoryFields(productsDataset.fields, productsDataset.rows)).toEqual(['category']);
  });

  it('rejects a string field with 13 distinct values', () => {
    const rows = rowsWithTypes(Array.from({ length: 13 }, (_, i) => `v${i}`));
    expect(eligibleCategoryFields(typeField, rows)).toEqual([]);
  });

  it('rejects a field with only null or empty values', () => {
    expect(eligibleCategoryFields(typeField, rowsWithTypes([null, '', undefined, '']))).toEqual([]);
  });
});

describe('buildBreakdown', () => {
  it('returns slices sorted by count with integer percentages', () => {
    const breakdown = buildBreakdown(['type'], rowsWithTypes(['a', 'a', 'b']));
    expect(breakdown?.field).toBe('type');
    expect(breakdown?.slices).toEqual([
      { label: 'a', count: 2, pct: 67 },
      { label: 'b', count: 1, pct: 33 },
    ]);
  });

  it('keeps the top 5 and groups the rest as Other when more than 6 values', () => {
    const input = rowsWithTypes(['a', 'a', 'a', 'b', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const breakdown = buildBreakdown(['type'], input)!;
    expect(breakdown.slices).toHaveLength(6);
    expect(breakdown.slices[5].label).toBe('Other');
    expect(breakdown.slices.reduce((sum, s) => sum + s.count, 0)).toBe(input.length);
  });

  it('returns null when every result shares one value', () => {
    expect(buildBreakdown(['type'], rowsWithTypes(['a', 'a', 'a']))).toBeNull();
  });

  it('skips empty values', () => {
    const breakdown = buildBreakdown(['type'], rowsWithTypes(['a', null, '', 'b']))!;
    expect(breakdown.slices.map((s) => s.label)).toEqual(['a', 'b']);
  });

  it('falls back to the auto pick when the explicit field is not eligible', () => {
    const rows = [
      { role: 'x', status: 'p' },
      { role: 'x', status: 'q' },
    ];
    expect(buildBreakdown(['role', 'status'], rows, 'email')?.field).toBe('status');
    expect(buildBreakdown(['role', 'status'], rows)?.candidates).toEqual(['status']);
  });

  it('honours an explicit eligible field', () => {
    const rows = [
      { role: 'x', status: 'p' },
      { role: 'y', status: 'q' },
    ];
    expect(buildBreakdown(['role', 'status'], rows, 'status')?.field).toBe('status');
  });
});

describe('buildTimeline', () => {
  it('buckets the events dataset by week', () => {
    const timeline = buildTimeline(eventsDataset.fields, eventsDataset.rows, eventsDataset.rows)!;
    expect(timeline.field).toBe('timestamp');
    expect(timeline.unit).toBe('week');
    expect(timeline.buckets.every((b) => b.matched === b.total)).toBe(true);
    expect(timeline.buckets.reduce((sum, b) => sum + b.total, 0)).toBe(1000);
  });

  it('uses day buckets for a short range', () => {
    const fields: FieldDefinition[] = [{ key: 'at', label: 'At', type: 'date' }];
    const rows = Array.from({ length: 10 }, (_, i) => ({ at: `2024-01-0${3 + (i % 5)}T10:00:00Z` }));
    const timeline = buildTimeline(fields, rows, rows.slice(0, 3))!;
    expect(timeline.unit).toBe('day');
    expect(timeline.buckets).toHaveLength(5);
    expect(timeline.buckets[0].label).toBe('3 Jan');
    expect(timeline.buckets.reduce((sum, b) => sum + b.matched, 0)).toBe(3);
  });

  it('uses month buckets for a multi-year range', () => {
    const fields: FieldDefinition[] = [{ key: 'at', label: 'At', type: 'date' }];
    const rows = [{ at: '2021-01-15' }, { at: '2022-06-01' }, { at: '2024-01-20' }];
    const timeline = buildTimeline(fields, rows, rows)!;
    expect(timeline.unit).toBe('month');
    expect(timeline.buckets[0].label).toBe('Jan 2021');
    expect(timeline.buckets).toHaveLength(37);
  });

  it('labels week buckets from their Monday', () => {
    const fields: FieldDefinition[] = [{ key: 'at', label: 'At', type: 'date' }];
    const rows = [{ at: '2024-11-14' }, { at: '2025-03-01' }];
    const timeline = buildTimeline(fields, rows, rows)!;
    expect(timeline.unit).toBe('week');
    expect(timeline.buckets[0].label).toBe('Week of 11 Nov');
  });

  it('returns null without a date field', () => {
    expect(buildTimeline(productsDataset.fields, productsDataset.rows, productsDataset.rows)).toBeNull();
  });

  it('returns null when no date parses', () => {
    const fields: FieldDefinition[] = [{ key: 'at', label: 'At', type: 'date' }];
    const rows = [{ at: 'not a date' }, { at: 'nope' }];
    expect(buildTimeline(fields, rows, rows)).toBeNull();
  });

  it('skips invalid dates without producing NaN', () => {
    const fields: FieldDefinition[] = [{ key: 'at', label: 'At', type: 'date' }];
    const rows = [{ at: '2024-01-01' }, { at: 'garbage' }, { at: null }, { at: '2024-01-04' }];
    const timeline = buildTimeline(fields, rows, rows)!;
    for (const b of timeline.buckets) {
      expect(Number.isFinite(b.start)).toBe(true);
      expect(Number.isFinite(b.total)).toBe(true);
      expect(Number.isFinite(b.matched)).toBe(true);
    }
    expect(timeline.buckets.reduce((sum, b) => sum + b.total, 0)).toBe(2);
  });
});

describe('performance', () => {
  it('recomputes the bento for 50k rows in under 50 ms (warm, median of 3)', () => {
    const fields: FieldDefinition[] = [
      { key: 'at', label: 'At', type: 'date' },
      { key: 'kind', label: 'Kind', type: 'string' },
    ];
    const kinds = ['a', 'b', 'c'];
    const base = Date.UTC(2023, 0, 1);
    const rows = Array.from({ length: 50_000 }, (_, i) => ({
      at: new Date(base + (i % 700) * 86_400_000).toISOString(),
      kind: kinds[i % 3],
    }));
    const results = rows.filter((_, i) => i % 2 === 0);

    const run = () => {
      const start = performance.now();
      buildTimeline(fields, rows, results);
      buildBreakdown(eligibleCategoryFields(fields, rows), results);
      return performance.now() - start;
    };

    run(); // warm-up: the app recomputes on every query, so steady state is what matters
    const samples = [run(), run(), run()].sort((a, b) => a - b);
    expect(samples[1]).toBeLessThan(50);
  });
});
