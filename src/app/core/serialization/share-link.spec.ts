import { describe, expect, it } from 'vitest';
import { deserialize, SerializedQuery } from './query-serializer';
import { buildShareUrl } from './share-link';

const query: SerializedQuery = {
  datasetId: 'events',
  filterTree: {
    type: 'group',
    op: 'AND',
    children: [{ type: 'condition', field: 'type', operator: 'eq', value: 'ñandú/+=' }],
  },
  transformation: { type: 'sort', field: 'value', direction: 'desc' },
};

describe('buildShareUrl', () => {
  it('points at the workspace with a q param', () => {
    expect(buildShareUrl('http://localhost:3000', query).startsWith('http://localhost:3000/workspace?q=')).toBe(true);
  });

  it('round-trips through deserialize, including +, /, = and non-ASCII', () => {
    const url = buildShareUrl('http://localhost:3000', query);
    const q = new URL(url).searchParams.get('q')!;
    expect(deserialize(q)).toEqual(query);
  });
});
