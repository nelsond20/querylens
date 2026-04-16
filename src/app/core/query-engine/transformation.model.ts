export type AggregateOp = 'count' | 'sum' | 'avg' | 'min' | 'max';

export type Transformation =
  | { type: 'map'; fields: string[] }
  | { type: 'groupBy'; field: string; aggregate: AggregateOp; valueField?: string }
  | { type: 'sort'; field: string; direction: 'asc' | 'desc' };
