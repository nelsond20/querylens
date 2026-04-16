import { FilterCondition, FilterGroup, FilterNode } from './filter-node.model';
import { Operator } from './operator.model';

export function execute(rows: Record<string, unknown>[], tree: FilterGroup): Record<string, unknown>[] {
  if (tree.children.length === 0) {
    return rows;
  }
  return rows.filter((row) => evaluateNode(row, tree));
}

function evaluateNode(row: Record<string, unknown>, node: FilterNode): boolean {
  if (node.type === 'group') {
    return evaluateGroup(row, node);
  }
  return evaluateCondition(row[node.field], node.operator, node.value);
}

function evaluateGroup(row: Record<string, unknown>, group: FilterGroup): boolean {
  if (group.children.length === 0) {
    return true;
  }
  return group.op === 'AND'
    ? group.children.every((child) => evaluateNode(row, child))
    : group.children.some((child) => evaluateNode(row, child));
}

function evaluateCondition(value: unknown, operator: Operator, target: unknown): boolean {
  switch (operator) {
    case 'eq':
      return value === target;
    case 'neq':
      return value !== target;
    case 'gt':
      return (value as number) > (target as number);
    case 'gte':
      return (value as number) >= (target as number);
    case 'lt':
      return (value as number) < (target as number);
    case 'lte':
      return (value as number) <= (target as number);
    case 'contains':
      return String(value).toLowerCase().includes(String(target).toLowerCase());
    case 'startsWith':
      return String(value).toLowerCase().startsWith(String(target).toLowerCase());
    case 'in':
      return Array.isArray(target) ? target.includes(value) : false;
    case 'notIn':
      return Array.isArray(target) ? !target.includes(value) : true;
  }
}

export const queryEngineInternals = {
  evaluateCondition,
  evaluateGroup,
  evaluateNode,
};
