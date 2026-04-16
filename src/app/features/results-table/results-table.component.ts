import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  protected readonly searchTerm = signal('');
  protected readonly sortField = signal('');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');

  protected readonly rows = computed(() => {
    const baseRows = this.store.displayedResults();
    const term = this.searchTerm().trim().toLowerCase();

    const filtered = term
      ? baseRows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(term)))
      : baseRows;

    const sortField = this.sortField();
    if (!sortField) {
      return filtered;
    }

    const direction = this.sortDirection();
    return [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) {
        return 0;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const compare = String(aValue).localeCompare(String(bValue));
      return direction === 'asc' ? compare : -compare;
    });
  });

  get columns(): string[] {
    const rows = this.store.displayedResults();
    if (rows.length > 0) {
      return Object.keys(rows[0]);
    }
    return this.store.selectedDataset().fields.map((field) => field.key);
  }

  get columnLabels(): Record<string, string> {
    const labels = this.store.selectedDataset().fields.reduce(
      (acc, field) => ({ ...acc, [field.key]: field.label }),
      {} as Record<string, string>,
    );
    for (const column of this.columns) {
      if (!labels[column]) {
        labels[column] = column;
      }
    }
    return labels;
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected setSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortField.set(field);
    this.sortDirection.set('asc');
  }

  protected exportCsv(): void {
    const rows = this.rows();
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
    this.download(`querylens-${Date.now()}.json`, JSON.stringify(this.rows(), null, 2), 'application/json');
  }

  protected trackByIndex(index: number): number {
    return index;
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
