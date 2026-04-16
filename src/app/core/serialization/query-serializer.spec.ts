import { describe, expect, it } from 'vitest';
import { FilterGroup } from '../query-engine/filter-node.model';
import { deserialize, serialize } from './query-serializer';

const filterTree: FilterGroup = {
  type: 'group',
  op: 'AND',
  children: [{ type: 'condition', field: 'status', operator: 'eq', value: 'active' }],
};

describe('serialize / deserialize', () => {
  it('serializes and deserializes without loss', () => {
    const encoded = serialize({ datasetId: 'users', filterTree, transformation: null });
    const decoded = deserialize(encoded);

    expect(decoded?.datasetId).toBe('users');
    expect(decoded?.filterTree).toEqual(filterTree);
    expect(decoded?.transformation).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(deserialize('')).toBeNull();
  });

  it('returns null for invalid Base64', () => {
    expect(deserialize('!!!invalid!!!')).toBeNull();
  });
});
