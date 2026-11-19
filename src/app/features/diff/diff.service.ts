import { Injectable, computed, inject } from '@angular/core';
import { diff, DiffResult } from '../../core/query-engine/diff-engine';
import { execute } from '../../core/query-engine/query-engine';
import { applyTransformation } from '../../core/query-engine/transform-engine';
import { WorkspaceUiService } from '../../pages/workspace-page/workspace-ui.service';
import { HistoryStore } from '../../store/history.store';
import { QueryStore } from '../../store/query.store';

/** Compares the current result with a saved snapshot; shared by the Compare panel and the Diff tab. */
@Injectable({ providedIn: 'root' })
export class DiffService {
  private readonly queryStore = inject(QueryStore);
  private readonly historyStore = inject(HistoryStore);
  private readonly ui = inject(WorkspaceUiService);

  readonly snapshot = computed(() => {
    const id = this.ui.compareSnapshotId();
    return id ? (this.historyStore.entries().find((entry) => entry.id === id) ?? null) : null;
  });

  readonly historicalRows = computed(() => {
    const entry = this.snapshot();
    if (!entry) {
      return [];
    }
    const dataset = this.queryStore.findDataset(entry.datasetId);
    if (!dataset) {
      return [];
    }
    const base = execute(dataset.rows, entry.filterTree);
    return entry.transformation ? applyTransformation(base, entry.transformation) : base;
  });

  readonly result = computed<DiffResult | null>(() =>
    this.snapshot() ? diff(this.historicalRows(), this.queryStore.displayedResults()) : null,
  );

  readonly columns = computed(() => {
    const current = this.queryStore.displayedResults();
    if (current.length > 0) {
      return Object.keys(current[0]);
    }
    const historical = this.historicalRows();
    return historical.length > 0 ? Object.keys(historical[0]) : [];
  });
}
