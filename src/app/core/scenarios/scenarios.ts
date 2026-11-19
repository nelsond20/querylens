import { FilterGroup } from '../query-engine/filter-node.model';
import { Transformation } from '../query-engine/transformation.model';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  datasetId: string;
  filterTree: FilterGroup;
  transformation: Transformation | null;
}

export const FIRST_SCENARIO_ID = 'high-value-events';

export const SCENARIOS: Scenario[] = [
  {
    id: FIRST_SCENARIO_ID,
    title: 'High-value events',
    description: 'Purchases, sign-ups and clicks worth more than 100, highest value first.',
    datasetId: 'events',
    filterTree: {
      type: 'group',
      op: 'AND',
      children: [
        { type: 'condition', field: 'value', operator: 'gt', value: 100 },
        { type: 'condition', field: 'type', operator: 'in', value: ['purchase', 'signup', 'click'] },
      ],
    },
    transformation: { type: 'sort', field: 'value', direction: 'desc' },
  },
  {
    id: 'accounts-needing-attention',
    title: 'Accounts needing attention',
    description: 'Accounts that are inactive or still pending, oldest first.',
    datasetId: 'users',
    filterTree: {
      type: 'group',
      op: 'AND',
      children: [{ type: 'condition', field: 'status', operator: 'in', value: ['inactive', 'pending'] }],
    },
    transformation: { type: 'sort', field: 'createdAt', direction: 'asc' },
  },
  {
    id: 'low-stock-catalog',
    title: 'Low stock watchlist',
    description: 'Products with fewer than 30 units in stock, best rated first.',
    datasetId: 'products',
    filterTree: {
      type: 'group',
      op: 'AND',
      children: [{ type: 'condition', field: 'stock', operator: 'lt', value: 30 }],
    },
    transformation: { type: 'sort', field: 'rating', direction: 'desc' },
  },
];
