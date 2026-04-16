export interface DiffResult {
  added: Record<string, unknown>[];
  removed: Record<string, unknown>[];
  unchanged: Record<string, unknown>[];
}

interface RowBucket {
  rows: Record<string, unknown>[];
  count: number;
}

export function diff(a: Record<string, unknown>[], b: Record<string, unknown>[]): DiffResult {
  const indexA = buildIndex(a);
  const indexB = buildIndex(b);

  const unchanged: Record<string, unknown>[] = [];
  const removed: Record<string, unknown>[] = [];
  const added: Record<string, unknown>[] = [];

  const signatures = new Set([...indexA.keys(), ...indexB.keys()]);

  for (const signature of signatures) {
    const bucketA = indexA.get(signature) ?? { rows: [], count: 0 };
    const bucketB = indexB.get(signature) ?? { rows: [], count: 0 };

    const common = Math.min(bucketA.count, bucketB.count);

    if (common > 0) {
      unchanged.push(...bucketB.rows.slice(0, common));
    }

    if (bucketA.count > common) {
      removed.push(...bucketA.rows.slice(common));
    }

    if (bucketB.count > common) {
      added.push(...bucketB.rows.slice(common));
    }
  }

  return { added, removed, unchanged };
}

function buildIndex(rows: Record<string, unknown>[]): Map<string, RowBucket> {
  const index = new Map<string, RowBucket>();

  for (const row of rows) {
    const signature = stableStringify(row);
    const current = index.get(signature);

    if (!current) {
      index.set(signature, { rows: [row], count: 1 });
      continue;
    }

    current.rows.push(row);
    current.count += 1;
  }

  return index;
}

function stableStringify(row: Record<string, unknown>): string {
  const normalized = Object.keys(row)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = row[key];
      return acc;
    }, {});

  return JSON.stringify(normalized);
}
