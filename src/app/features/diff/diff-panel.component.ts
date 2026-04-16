import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getDataset } from '../../core/datasets/datasets.registry';
import { diff, DiffResult } from '../../core/query-engine/diff-engine';
import { execute } from '../../core/query-engine/query-engine';
import { applyTransformation } from '../../core/query-engine/transform-engine';
import { HistoryStore } from '../../store/history.store';
import { QueryStore } from '../../store/query.store';

@Component({
  selector: 'app-diff-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diff-panel.component.html',
  styleUrl: './diff-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffPanelComponent {
  protected readonly queryStore = inject(QueryStore);
  protected readonly historyStore = inject(HistoryStore);
  protected readonly selectedHistoryId = signal('');

  protected readonly historicalRows = computed(() => {
    const id = this.selectedHistoryId();
    if (!id) {
      return [];
    }

    const entry = this.historyStore.entries().find((item) => item.id === id);
    if (!entry) {
      return [];
    }

    const dataset = getDataset(entry.datasetId);
    const base = execute(dataset.rows, entry.filterTree);

    return entry.transformation ? applyTransformation(base, entry.transformation) : base;
  });

  protected readonly diffResult = computed<DiffResult | null>(() => {
    if (!this.selectedHistoryId()) {
      return null;
    }

    return diff(this.historicalRows(), this.queryStore.displayedResults());
  });

  get columns(): string[] {
    const current = this.queryStore.displayedResults();
    if (current.length > 0) {
      return Object.keys(current[0]);
    }

    const historical = this.historicalRows();
    return historical.length > 0 ? Object.keys(historical[0]) : [];
  }
}
