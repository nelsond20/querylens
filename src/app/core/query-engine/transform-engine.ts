import { AggregateOp, Transformation } from './transformation.model';

export function applyTransformation(
  rows: Record<string, unknown>[],
  transformation: Transformation,
): Record<string, unknown>[] {
  switch (transformation.type) {
    case 'map':
      return rows.map((row) => pick(row, transformation.fields));
    case 'sort':
      return sortRows(rows, transformation.field, transformation.direction);
    case 'groupBy':
      return groupBy(rows, transformation.field, transformation.aggregate, transformation.valueField);
  }
}

function pick(row: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = row[key];
    return acc;
  }, {});
}

function sortRows(
  rows: Record<string, unknown>[],
  field: string,
  direction: 'asc' | 'desc',
): Record<string, unknown>[] {
  return [...rows].sort((a, b) => {
    const av = a[field] as string | number;
    const bv = b[field] as string | number;
    if (av < bv) {
      return direction === 'asc' ? -1 : 1;
    }
    if (av > bv) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

function groupBy(
  rows: Record<string, unknown>[],
  field: string,
  aggregate: AggregateOp,
  valueField?: string,
): Record<string, unknown>[] {
  const groups = new Map<unknown, Record<string, unknown>[]>();

  for (const row of rows) {
    const key = row[field];
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(row);
  }

  return Array.from(groups.entries()).map(([key, groupRows]) => {
    const result: Record<string, unknown> = { [field]: key };

    if (aggregate === 'count') {
      result['count'] = groupRows.length;
      return result;
    }

    if (!valueField) {
      return result;
    }

    const values = groupRows
      .map((r) => r[valueField])
      .filter((v): v is number => typeof v === 'number');

    result[aggregate] = computeAggregate(values, aggregate);
    return result;
  });
}

function computeAggregate(values: number[], op: Exclude<AggregateOp, 'count'>): number {
  if (values.length === 0) {
    return 0;
  }

  switch (op) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
  }
}
