import { describe, expect, it } from 'vitest';
import { treemapLayout } from './treemap-layout';

const area = (r: { w: number; h: number }) => r.w * r.h;

describe('treemapLayout', () => {
  it('returns one rect covering everything for a single value', () => {
    expect(treemapLayout([5])).toEqual([{ x: 0, y: 0, w: 1, h: 1 }]);
  });

  it('gives each rect an area proportional to its value', () => {
    const values = [50, 30, 20];
    const rects = treemapLayout(values);
    expect(rects).toHaveLength(3);
    rects.forEach((r, i) => expect(area(r)).toBeCloseTo(values[i] / 100, 6));
  });

  it('tiles the unit square without gaps', () => {
    const rects = treemapLayout([40, 25, 15, 10, 6, 4]);
    expect(rects.reduce((sum, r) => sum + area(r), 0)).toBeCloseTo(1, 6);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(1 + 1e-9);
      expect(r.y + r.h).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('splits along the longer side given an aspect ratio', () => {
    const [a, b] = treemapLayout([1, 1], 2);
    expect(a.h).toBeCloseTo(1, 6);
    expect(b.x).toBeCloseTo(0.5, 6);
  });

  it('returns no rects for empty or all-zero input', () => {
    expect(treemapLayout([])).toEqual([]);
    expect(treemapLayout([0, 0])).toEqual([]);
  });
});
