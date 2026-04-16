import { describe, expect, it } from 'vitest';
import { applyTransformation } from './transform-engine';

const rows = [
  { id: '1', category: 'a', price: 10, name: 'Foo' },
  { id: '2', category: 'b', price: 20, name: 'Bar' },
  { id: '3', category: 'a', price: 30, name: 'Baz' },
];

describe('applyTransformation - map', () => {
  it('keeps only selected fields', () => {
    const result = applyTransformation(rows, { type: 'map', fields: ['id', 'name'] });
    expect(result).toEqual([
      { id: '1', name: 'Foo' },
      { id: '2', name: 'Bar' },
      { id: '3', name: 'Baz' },
    ]);
  });
});

describe('applyTransformation - sort', () => {
  it('sorts ascending', () => {
    const result = applyTransformation(rows, { type: 'sort', field: 'price', direction: 'asc' });
    expect(result.map((row) => row['price'])).toEqual([10, 20, 30]);
  });

  it('sorts descending', () => {
    const result = applyTransformation(rows, { type: 'sort', field: 'price', direction: 'desc' });
    expect(result.map((row) => row['price'])).toEqual([30, 20, 10]);
  });
});

describe('applyTransformation - groupBy', () => {
  it('groups by field and counts', () => {
    const result = applyTransformation(rows, { type: 'groupBy', field: 'category', aggregate: 'count' });
    expect(result).toContainEqual({ category: 'a', count: 2 });
    expect(result).toContainEqual({ category: 'b', count: 1 });
  });

  it('groups and sums valueField', () => {
    const result = applyTransformation(rows, {
      type: 'groupBy',
      field: 'category',
      aggregate: 'sum',
      valueField: 'price',
    });

    expect(result).toContainEqual({ category: 'a', sum: 40 });
    expect(result).toContainEqual({ category: 'b', sum: 20 });
  });
});
