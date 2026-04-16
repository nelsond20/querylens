import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { BUILT_IN_DATASETS, getBuiltInDataset } from '../core/datasets/datasets.registry';
import { Dataset } from '../core/datasets/dataset.model';
import { FilterGroup } from '../core/query-engine/filter-node.model';
import { execute } from '../core/query-engine/query-engine';
import { applyTransformation } from '../core/query-engine/transform-engine';
import { Transformation } from '../core/query-engine/transformation.model';
import { initialQueryState, QueryState } from './query-state.model';

const CUSTOM_DATASETS_STORAGE_KEY = 'querylens:custom-datasets';

export const QueryStore = signalStore(
  { providedIn: 'root' },
  withState<QueryState>(initialQueryState),
  withHooks({
    onInit(store) {
      try {
        const raw = localStorage.getItem(CUSTOM_DATASETS_STORAGE_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as Dataset[];
        if (Array.isArray(parsed)) {
          patchState(store, { customDatasets: parsed });
        }
      } catch {
        patchState(store, { customDatasets: [] });
      }
    },
  }),
  withComputed(({ customDatasets, filterTree, results, scannedRows, selectedDatasetId, transformation, transformedResults }) => ({
    availableDatasets: computed(() => [...BUILT_IN_DATASETS, ...customDatasets()]),
    selectedDataset: computed(() => resolveDataset(selectedDatasetId(), customDatasets()) ?? BUILT_IN_DATASETS[0]),
    resultCount: computed(() => results().length),
    displayedResults: computed(() => (transformation() ? transformedResults() : results())),
    filterIsEmpty: computed(() => filterTree().children.length === 0),
    matchRate: computed(() => {
      const total = scannedRows();
      if (total === 0) {
        return 0;
      }
      return Math.round((results().length / total) * 1000) / 10;
    }),
  })),
  withMethods((store) => ({
    setDataset(id: string): void {
      if (!resolveDataset(id, store.customDatasets())) {
        return;
      }

      patchState(store, {
        selectedDatasetId: id,
        filterTree: { type: 'group', op: 'AND', children: [] },
        rawQuery: '{\n  "type": "group",\n  "op": "AND",\n  "children": []\n}',
        rawQueryError: null,
        results: [],
        transformation: null,
        transformedResults: [],
        scannedRows: 0,
        lastExecutionMs: null,
        lastExecutedAt: null,
      });
    },

    addCustomDataset(dataset: Dataset): void {
      const filtered = store.customDatasets().filter((item) => item.id !== dataset.id);
      const customDatasets = [dataset, ...filtered];

      patchState(store, { customDatasets });
      persistCustomDatasets(customDatasets);
    },

    removeCustomDataset(id: string): void {
      const customDatasets = store.customDatasets().filter((dataset) => dataset.id !== id);
      patchState(store, { customDatasets });
      persistCustomDatasets(customDatasets);

      if (store.selectedDatasetId() === id) {
        patchState(store, {
          selectedDatasetId: BUILT_IN_DATASETS[0].id,
          filterTree: { type: 'group', op: 'AND', children: [] },
          rawQuery: '{\n  "type": "group",\n  "op": "AND",\n  "children": []\n}',
          rawQueryError: null,
          results: [],
          transformation: null,
          transformedResults: [],
          scannedRows: 0,
          lastExecutionMs: null,
          lastExecutedAt: null,
        });
      }
    },

    clearCustomDatasets(): void {
      patchState(store, { customDatasets: [] });
      localStorage.removeItem(CUSTOM_DATASETS_STORAGE_KEY);

      if (store.selectedDataset().source !== 'built-in') {
        patchState(store, {
          selectedDatasetId: BUILT_IN_DATASETS[0].id,
          filterTree: { type: 'group', op: 'AND', children: [] },
          rawQuery: '{\n  "type": "group",\n  "op": "AND",\n  "children": []\n}',
          rawQueryError: null,
          results: [],
          transformation: null,
          transformedResults: [],
          scannedRows: 0,
          lastExecutionMs: null,
          lastExecutedAt: null,
        });
      }
    },

    hasDataset(id: string): boolean {
      return resolveDataset(id, store.customDatasets()) !== null;
    },

    findDataset(id: string): Dataset | null {
      return resolveDataset(id, store.customDatasets());
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
        patchState(store, { rawQueryError: 'Invalid JSON syntax' });
      }
    },

    executeQuery(): void {
      const dataset = store.selectedDataset();
      const start = performance.now();
      const scannedRows = dataset.rows.length;

      if (dataset.rows.length > 5000) {
        patchState(store, { isExecuting: true, scannedRows });

        const worker = new Worker(new URL('../workers/query.worker', import.meta.url), {
          type: 'module',
        });

        worker.onmessage = ({ data }: MessageEvent<Record<string, unknown>[]>) => {
          patchState(store, {
            results: data,
            transformedResults: [],
            transformation: null,
            isExecuting: false,
            scannedRows,
            lastExecutionMs: Math.round((performance.now() - start) * 10) / 10,
            lastExecutedAt: new Date().toISOString(),
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
        scannedRows,
        lastExecutionMs: Math.round((performance.now() - start) * 10) / 10,
        lastExecutedAt: new Date().toISOString(),
      });
    },

    applyTransformation(transformation: Transformation): void {
      const transformedResults = applyTransformation(store.results(), transformation);
      patchState(store, { transformation, transformedResults });
    },

    clearTransformation(): void {
      patchState(store, {
        transformation: null,
        transformedResults: [],
      });
    },

    clearQuery(): void {
      patchState(store, {
        ...initialQueryState,
        selectedDatasetId: store.selectedDatasetId(),
        customDatasets: store.customDatasets(),
      });
    },

    hydrateFrom(state: Partial<QueryState>): void {
      patchState(store, state);
    },
  })),
);

function resolveDataset(id: string, customDatasets: Dataset[]): Dataset | null {
  const builtIn = getBuiltInDataset(id);
  if (builtIn) {
    return builtIn;
  }

  return customDatasets.find((dataset) => dataset.id === id) ?? null;
}

function persistCustomDatasets(datasets: Dataset[]): void {
  localStorage.setItem(CUSTOM_DATASETS_STORAGE_KEY, JSON.stringify(datasets));
}
