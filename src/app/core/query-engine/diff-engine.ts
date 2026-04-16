export interface DiffResult {
  added: Record<string, unknown>[];
  removed: Record<string, unknown>[];
  unchanged: Record<string, unknown>[];
}

export function diff(a: Record<string, unknown>[], b: Record<string, unknown>[]): DiffResult {
  const maxLen = Math.max(a.length, b.length);
  const added: Record<string, unknown>[] = [];
  const removed: Record<string, unknown>[] = [];
  const unchanged: Record<string, unknown>[] = [];

  for (let i = 0; i < maxLen; i += 1) {
    if (i >= a.length) {
      added.push(b[i]);
    } else if (i >= b.length) {
      removed.push(a[i]);
    } else {
      unchanged.push(b[i]);
    }
  }

  return { added, removed, unchanged };
}
