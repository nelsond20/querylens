import { Operator } from './operator.model';

export type FilterNode = FilterGroup | FilterCondition;

export interface FilterGroup {
  type: 'group';
  op: 'AND' | 'OR';
  children: FilterNode[];
}

export interface FilterCondition {
  type: 'condition';
  field: string;
  operator: Operator;
  value: unknown;
}
