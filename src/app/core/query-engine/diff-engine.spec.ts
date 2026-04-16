import { describe, expect, it } from 'vitest';
import { diff } from './diff-engine';

describe('diff', () => {
  it('marks common rows as unchanged', () => {
    const a = [{ id: '1' }, { id: '2' }];
    const b = [{ id: '1' }, { id: '2' }];

    const result = diff(a, b);

    expect(result.unchanged).toHaveLength(2);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it('marks extra rows in B as added', () => {
    const a = [{ id: '1' }];
    const b = [{ id: '1' }, { id: '2' }];

    const result = diff(a, b);

    expect(result.added).toHaveLength(1);
    expect(result.added[0]['id']).toBe('2');
  });

  it('marks extra rows in A as removed', () => {
    const a = [{ id: '1' }, { id: '2' }];
    const b = [{ id: '1' }];

    const result = diff(a, b);

    expect(result.removed).toHaveLength(1);
    expect(result.removed[0]['id']).toBe('2');
  });

  it('handles empty arrays', () => {
    const result = diff([], []);

    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
  });

  it('is order agnostic for identical rows', () => {
    const a = [{ id: '1' }, { id: '2' }];
    const b = [{ id: '2' }, { id: '1' }];

    const result = diff(a, b);

    expect(result.unchanged).toHaveLength(2);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });
});
