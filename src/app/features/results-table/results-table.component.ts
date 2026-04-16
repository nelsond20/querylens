import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { getDataset } from '../../core/datasets/datasets.registry';
import { QueryStore } from '../../store/query.store';

@Component({
  selector: 'app-results-table',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsTableComponent {
  protected readonly store = inject(QueryStore);

  get columns(): string[] {
    return getDataset(this.store.selectedDatasetId()).fields.map((field) => field.key);
  }

  get columnLabels(): Record<string, string> {
    return getDataset(this.store.selectedDatasetId()).fields.reduce(
      (acc, field) => ({ ...acc, [field.key]: field.label }),
      {} as Record<string, string>,
    );
  }

  protected exportCsv(): void {
    const rows = this.store.displayedResults();
    if (rows.length === 0) {
      return;
    }

    const columns = Object.keys(rows[0]);
    const header = columns.join(',');
    const body = rows
      .map((row) => columns.map((column) => JSON.stringify(row[column] ?? '')).join(','))
      .join('\n');

    this.download(`querylens-${Date.now()}.csv`, `${header}\n${body}`, 'text/csv');
  }

  protected exportJson(): void {
    this.download(
      `querylens-${Date.now()}.json`,
      JSON.stringify(this.store.displayedResults(), null, 2),
      'application/json',
    );
  }

  private download(filename: string, content: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
