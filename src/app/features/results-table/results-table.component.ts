import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { eligibleCategoryFields } from '../../core/insights/bento-data';
import { formatDateValue } from '../../core/insights/format';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';
import { QueryStore } from '../../store/query.store';

type ColumnKind = 'number' | 'date' | 'category' | 'text';

@Component({
  selector: 'app-results-table',
  standalone: true,
  imports: [CommonModule, ScrollingModule, QlIconComponent],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsTableComponent implements AfterViewInit, OnDestroy {
  protected readonly store = inject(QueryStore);
  protected readonly rowHeight = 36;
  protected readonly searchTerm = signal('');
  protected readonly sortField = signal('');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  private resizeObserver: ResizeObserver | null = null;

  @ViewChild(CdkVirtualScrollViewport) private viewport?: CdkVirtualScrollViewport;
  @ViewChild('tableWrapper') private tableWrapper?: ElementRef<HTMLElement>;

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

  private readonly viewportResizeEffect = effect(() => {
    this.rows();
    queueMicrotask(() => {
      this.viewport?.checkViewportSize();
    });
  });

  private readonly categoryFields = computed(
    () => new Set(eligibleCategoryFields(this.store.selectedDataset().fields, this.store.selectedDataset().rows)),
  );

  /** How each visible column renders: aligned numbers, readable dates, category chips. */
  protected readonly columnKinds = computed<Record<string, ColumnKind>>(() => {
    const types = Object.fromEntries(this.store.selectedDataset().fields.map((f) => [f.key, f.type]));
    const first = this.store.displayedResults()[0] ?? {};
    const kinds: Record<string, ColumnKind> = {};
    for (const column of this.columns) {
      const type = types[column];
      if (type === 'number' || (!type && typeof first[column] === 'number')) kinds[column] = 'number';
      else if (type === 'date') kinds[column] = 'date';
      else if (this.categoryFields().has(column)) kinds[column] = 'category';
      else kinds[column] = 'text';
    }
    return kinds;
  });

  protected readonly hasRun = computed(() => this.store.lastExecutionMs() !== null);

  protected display(row: Record<string, unknown>, column: string): string {
    const value = row[column];
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const kind = this.columnKinds()[column];
    if (kind === 'date') {
      return formatDateValue(value);
    }
    if (kind === 'number' && typeof value === 'number') {
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected clearFilters(): void {
    this.store.updateFilterTree({ type: 'group', op: 'AND', children: [] });
    this.store.executeQuery();
  }

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

  exportCsv(): void {
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

  exportJson(): void {
    this.download(`querylens-${Date.now()}.json`, JSON.stringify(this.rows(), null, 2), 'application/json');
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver !== 'undefined' && this.tableWrapper) {
      this.resizeObserver = new ResizeObserver(() => {
        this.viewport?.checkViewportSize();
      });
      this.resizeObserver.observe(this.tableWrapper.nativeElement);
    }

    queueMicrotask(() => {
      this.viewport?.checkViewportSize();
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
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
