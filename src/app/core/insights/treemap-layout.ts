export interface TreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Binary-split treemap in unit coordinates (0..1). Values are split into two groups of roughly
 * equal weight, cut along the longer side of the box, then each side recurses. `aspect` is the
 * container's width / height, so cuts follow the real shape on screen.
 */
export function treemapLayout(values: number[], aspect = 1): TreemapRect[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  if (values.length === 0 || total === 0) {
    return [];
  }
  const rects: TreemapRect[] = new Array(values.length);
  split(values.map((v, i) => ({ v: Math.max(0, v), i })), { x: 0, y: 0, w: 1, h: 1 }, aspect, rects);
  return rects;
}

function split(items: { v: number; i: number }[], box: TreemapRect, aspect: number, out: TreemapRect[]): void {
  if (items.length === 1) {
    out[items[0].i] = box;
    return;
  }

  const total = items.reduce((sum, item) => sum + item.v, 0);
  let acc = 0;
  let cut = 1;
  for (let k = 1; k < items.length; k++) {
    acc += items[k - 1].v;
    const nextAcc = acc + items[k].v;
    cut = k;
    if (Math.abs(nextAcc - total / 2) >= Math.abs(acc - total / 2)) {
      break;
    }
  }

  const first = items.slice(0, cut);
  const second = items.slice(cut);
  const ratio = total === 0 ? 0.5 : first.reduce((sum, item) => sum + item.v, 0) / total;

  if (box.w * aspect >= box.h) {
    const w1 = box.w * ratio;
    split(first, { x: box.x, y: box.y, w: w1, h: box.h }, aspect, out);
    split(second, { x: box.x + w1, y: box.y, w: box.w - w1, h: box.h }, aspect, out);
  } else {
    const h1 = box.h * ratio;
    split(first, { x: box.x, y: box.y, w: box.w, h: h1 }, aspect, out);
    split(second, { x: box.x, y: box.y + h1, w: box.w, h: box.h - h1 }, aspect, out);
  }
}
