import { FilterGroup } from '../core/query-engine/filter-node.model';
import { Transformation } from '../core/query-engine/transformation.model';
import { Dataset } from '../core/datasets/dataset.model';

export interface QueryState {
  selectedDatasetId: string;
  filterTree: FilterGroup;
  rawQuery: string;
  rawQueryError: string | null;
  results: Record<string, unknown>[];
  transformation: Transformation | null;
  transformedResults: Record<string, unknown>[];
  activeTab: 'diff' | 'history';
  isExecuting: boolean;
  scannedRows: number;
  lastExecutionMs: number | null;
  lastExecutedAt: string | null;
  customDatasets: Dataset[];
}

export const initialQueryState: QueryState = {
  selectedDatasetId: 'users',
  filterTree: { type: 'group', op: 'AND', children: [] },
  rawQuery: '{\n  "type": "group",\n  "op": "AND",\n  "children": []\n}',
  rawQueryError: null,
  results: [],
  transformation: null,
  transformedResults: [],
  activeTab: 'history',
  isExecuting: false,
  scannedRows: 0,
  lastExecutionMs: null,
  lastExecutedAt: null,
  customDatasets: [],
};
