import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

    const dataset = this.queryStore.findDataset(entry.datasetId);
    if (!dataset) {
      return [];
    }
    const base = execute(dataset.rows, entry.filterTree);

    return entry.transformation ? applyTransformation(base, entry.transformation) : base;
  });

  protected readonly diffResult = computed<DiffResult | null>(() => {
    if (!this.selectedHistoryId()) {
      return null;
    }

    return diff(this.historicalRows(), this.queryStore.displayedResults());
  });

  protected readonly addedPreview = computed(() => this.diffResult()?.added.slice(0, 20) ?? []);
  protected readonly removedPreview = computed(() => this.diffResult()?.removed.slice(0, 20) ?? []);

  get columns(): string[] {
    const current = this.queryStore.displayedResults();
    if (current.length > 0) {
      return Object.keys(current[0]);
    }

    const historical = this.historicalRows();
    return historical.length > 0 ? Object.keys(historical[0]) : [];
  }

  protected formatCell(row: Record<string, unknown>, column: string): string {
    const value = row[column];
    return value === undefined || value === null ? '-' : String(value);
  }
}
