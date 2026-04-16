import { describe, expect, it } from 'vitest';
import { FilterGroup } from './filter-node.model';
import { execute } from './query-engine';

const rows = [
  { id: '1', name: 'Alice', age: 30, status: 'active' },
  { id: '2', name: 'Bob', age: 25, status: 'inactive' },
  { id: '3', name: 'Carol', age: 30, status: 'active' },
];

const emptyTree: FilterGroup = { type: 'group', op: 'AND', children: [] };

describe('execute', () => {
  it('returns all rows when filter tree is empty', () => {
    expect(execute(rows, emptyTree)).toHaveLength(3);
  });

  it('filters with eq operator', () => {
    const tree: FilterGroup = {
      type: 'group',
      op: 'AND',
      children: [{ type: 'condition', field: 'status', operator: 'eq', value: 'active' }],
    };

    expect(execute(rows, tree)).toHaveLength(2);
  });

  it('filters with neq operator', () => {
    const tree: FilterGroup = {
      type: 'group',
      op: 'AND',
      children: [{ type: 'condition', field: 'status', operator: 'neq', value: 'active' }],
    };

    expect(execute(rows, tree)).toHaveLength(1);
  });

  it('filters with gt operator', () => {
    const tree: FilterGroup = {
      type: 'group',
      op: 'AND',
      children: [{ type: 'condition', field: 'age', operator: 'gt', value: 25 }],
    };

    expect(execute(rows, tree)).toHaveLength(2);
  });

  it('filters with contains operator', () => {
    const tree: FilterGroup = {
      type: 'group',
      op: 'AND',
      children: [{ type: 'condition', field: 'name', operator: 'contains', value: 'ol' }],
    };

    const result = execute(rows, tree);
    expect(result).toHaveLength(1);
    expect(result[0]['name']).toBe('Carol');
  });

  it('combines conditions with AND', () => {
    const tree: FilterGroup = {
      type: 'group',
      op: 'AND',
      children: [
        { type: 'condition', field: 'age', operator: 'eq', value: 30 },
        { type: 'condition', field: 'status', operator: 'eq', value: 'active' },
      ],
    };

    expect(execute(rows, tree)).toHaveLength(2);
  });

  it('combines conditions with OR', () => {
    const tree: FilterGroup = {
      type: 'group',
      op: 'OR',
      children: [
        { type: 'condition', field: 'name', operator: 'eq', value: 'Alice' },
        { type: 'condition', field: 'name', operator: 'eq', value: 'Bob' },
      ],
    };

    expect(execute(rows, tree)).toHaveLength(2);
  });

  it('supports nested groups', () => {
    const tree: FilterGroup = {
      type: 'group',
      op: 'AND',
      children: [
        { type: 'condition', field: 'age', operator: 'eq', value: 30 },
        {
          type: 'group',
          op: 'OR',
          children: [
            { type: 'condition', field: 'name', operator: 'eq', value: 'Alice' },
            { type: 'condition', field: 'name', operator: 'eq', value: 'Bob' },
          ],
        },
      ],
    };

    const result = execute(rows, tree);
    expect(result).toHaveLength(1);
    expect(result[0]['name']).toBe('Alice');
  });
});
