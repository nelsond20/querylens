import { describe, expect, it } from 'vitest';
import { createRuntimeDataset, parseCsvRows, parseJsonRows } from './runtime-dataset.utils';

describe('runtime-dataset utils', () => {
  it('parses object array JSON', () => {
    const rows = parseJsonRows('[{"id":"1","value":10}]');
    expect(rows).toHaveLength(1);
    expect(rows[0]['id']).toBe('1');
  });

  it('parses nested JSON object arrays', () => {
    const rows = parseJsonRows('{"meta":{"generatedAt":"2026-01-01"},"data":[{"id":1},{"id":2}]}');
    expect(rows).toHaveLength(2);
    expect(rows[1]['id']).toBe(2);
  });

  it('selects the largest object array when multiple arrays exist', () => {
    const rows = parseJsonRows(
      '{"summary":[{"id":"s1"}],"payload":{"groups":[{"id":"g1"},{"id":"g2"},{"id":"g3"}],"items":[{"id":"i1"}]}}',
    );
    expect(rows).toHaveLength(3);
    expect(rows[2]['id']).toBe('g3');
  });

  it('throws if no object array exists anywhere in payload', () => {
    expect(() => parseJsonRows('{"title":"fishing","data":[1,2,3]}')).toThrow(
      'JSON payload must contain an object array at any depth',
    );
  });

  it('throws when rows exceed import limit', () => {
    expect(() => parseJsonRows('{"data":[{"id":1},{"id":2},{"id":3}]}', { maxRows: 2 })).toThrow(
      'JSON dataset exceeds 2 rows limit',
    );
  });

  it('parses CSV with header', () => {
    const rows = parseCsvRows('id,name\n1,Alice\n2,Bob');
    expect(rows).toHaveLength(2);
    expect(rows[1]['name']).toBe('Bob');
  });

  it('infers field types', () => {
    const dataset = createRuntimeDataset({
      id: 'runtime-1',
      name: 'Runtime',
      description: 'desc',
      source: 'file',
      rows: [
        { id: '1', amount: '10', active: 'true', createdAt: '2026-01-01' },
        { id: '2', amount: '25', active: 'false', createdAt: '2026-01-02' },
      ],
    });

    const amount = dataset.fields.find((field) => field.key === 'amount');
    const active = dataset.fields.find((field) => field.key === 'active');
    const createdAt = dataset.fields.find((field) => field.key === 'createdAt');

    expect(amount?.type).toBe('number');
    expect(active?.type).toBe('boolean');
    expect(createdAt?.type).toBe('date');
    expect(dataset.rows[0]['amount']).toBe(10);
    expect(dataset.rows[0]['active']).toBe(true);
  });
});
