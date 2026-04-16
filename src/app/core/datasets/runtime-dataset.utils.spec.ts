import { describe, expect, it } from 'vitest';
import { createRuntimeDataset, parseCsvRows, parseJsonRows } from './runtime-dataset.utils';

describe('runtime-dataset utils', () => {
  it('parses object array JSON', () => {
    const rows = parseJsonRows('[{"id":"1","value":10}]');
    expect(rows).toHaveLength(1);
    expect(rows[0]['id']).toBe('1');
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
