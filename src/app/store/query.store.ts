import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getDataset } from '../core/datasets/datasets.registry';
import { FilterGroup } from '../core/query-engine/filter-node.model';
import { execute } from '../core/query-engine/query-engine';
import { applyTransformation } from '../core/query-engine/transform-engine';
import { Transformation } from '../core/query-engine/transformation.model';
import { initialQueryState, QueryState } from './query-state.model';

export const QueryStore = signalStore(
  { providedIn: 'root' },
  withState<QueryState>(initialQueryState),
  withComputed(({ filterTree, results, transformation, transformedResults }) => ({
    resultCount: computed(() => results().length),
    displayedResults: computed(() => (transformation() ? transformedResults() : results())),
    filterIsEmpty: computed(() => filterTree().children.length === 0),
  })),
  withMethods((store) => ({
    setDataset(id: string): void {
      patchState(store, {
        selectedDatasetId: id,
        filterTree: { type: 'group', op: 'AND', children: [] },
        rawQuery: '{\n  "type": "group",\n  "op": "AND",\n  "children": []\n}',
        rawQueryError: null,
        results: [],
        transformation: null,
        transformedResults: [],
      });
    },

    updateFilterTree(tree: FilterGroup): void {
      patchState(store, {
        filterTree: tree,
        rawQuery: JSON.stringify(tree, null, 2),
        rawQueryError: null,
      });
    },

    updateRawQuery(json: string): void {
      patchState(store, { rawQuery: json });

      try {
        const parsed = JSON.parse(json) as FilterGroup;
        patchState(store, { filterTree: parsed, rawQueryError: null });
      } catch {
        patchState(store, { rawQueryError: 'JSON inválido' });
      }
    },

    executeQuery(): void {
      const dataset = getDataset(store.selectedDatasetId());

      if (dataset.rows.length > 5000) {
        patchState(store, { isExecuting: true });
        const worker = new Worker(new URL('../workers/query.worker', import.meta.url), {
          type: 'module',
        });

        worker.onmessage = ({ data }: MessageEvent<Record<string, unknown>[]>) => {
          patchState(store, {
            results: data,
            transformedResults: [],
            transformation: null,
            isExecuting: false,
          });
          worker.terminate();
        };

        worker.postMessage({ rows: dataset.rows, filterTree: store.filterTree() });
        return;
      }

      const results = execute(dataset.rows, store.filterTree());
      patchState(store, {
        results,
        transformedResults: [],
        transformation: null,
        isExecuting: false,
      });
    },

    applyTransformation(transformation: Transformation): void {
      const transformedResults = applyTransformation(store.results(), transformation);
      patchState(store, { transformation, transformedResults });
    },

    clearQuery(): void {
      patchState(store, {
        ...initialQueryState,
        selectedDatasetId: store.selectedDatasetId(),
      });
    },

    hydrateFrom(state: Partial<QueryState>): void {
      patchState(store, state);
    },
  })),
);
