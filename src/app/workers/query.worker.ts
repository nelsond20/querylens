/// <reference lib="webworker" />

import { FilterGroup } from '../core/query-engine/filter-node.model';
import { execute } from '../core/query-engine/query-engine';

interface WorkerInput {
  rows: Record<string, unknown>[];
  filterTree: FilterGroup;
}

addEventListener('message', ({ data }: MessageEvent<WorkerInput>) => {
  const results = execute(data.rows, data.filterTree);
  postMessage(results);
});
