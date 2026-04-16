import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { HistoryEntry } from './history-entry.model';
import { QueryStore } from './query.store';

const STORAGE_KEY = 'querylens:history';

export const HistoryStore = signalStore(
  { providedIn: 'root' },
  withState<{ entries: HistoryEntry[] }>({ entries: [] }),
  withHooks({
    onInit(store) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return;
        }

        const entries = JSON.parse(raw) as HistoryEntry[];
        patchState(store, { entries });
      } catch {
        patchState(store, { entries: [] });
      }
    },
  }),
  withMethods((store, queryStore = inject(QueryStore)) => ({
    saveEntry(entry: HistoryEntry): void {
      const entries = [entry, ...store.entries()];
      patchState(store, { entries });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    },

    deleteEntry(id: string): void {
      const entries = store.entries().filter((entry) => entry.id !== id);
      patchState(store, { entries });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    },

    loadEntry(id: string): void {
      const entry = store.entries().find((item) => item.id === id);
      if (!entry) {
        return;
      }

      queryStore.hydrateFrom({
        selectedDatasetId: entry.datasetId,
        filterTree: entry.filterTree,
        rawQuery: JSON.stringify(entry.filterTree, null, 2),
        rawQueryError: null,
        transformation: entry.transformation,
      });

      queryStore.executeQuery();
      if (entry.transformation) {
        queryStore.applyTransformation(entry.transformation);
      }
    },
  })),
);
