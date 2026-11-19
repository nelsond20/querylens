import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DiffService } from './diff.service';

const PREVIEW_ROWS = 50;

@Component({
  selector: 'app-diff-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (diff.result(); as result) {
      <p class="lead">
        Current result compared with <strong>{{ diff.snapshot()?.name }}</strong>.
        Showing up to {{ previewRows }} rows per side.
      </p>
      <div class="split">
        <section class="side added" aria-labelledby="diff-added">
          <h3 id="diff-added">Added <span class="num">{{ result.added.length }}</span></h3>
          <div class="rows">
            @for (row of added(); track $index) {
              <div class="row">
                @for (column of diff.columns(); track column) {
                  <span class="cell" [title]="column">{{ format(row, column) }}</span>
                }
              </div>
            } @empty {
              <p class="none">No rows were added.</p>
            }
          </div>
        </section>
        <section class="side removed" aria-labelledby="diff-removed">
          <h3 id="diff-removed">Removed <span class="num">{{ result.removed.length }}</span></h3>
          <div class="rows">
            @for (row of removed(); track $index) {
              <div class="row">
                @for (column of diff.columns(); track column) {
                  <span class="cell" [title]="column">{{ format(row, column) }}</span>
                }
              </div>
            } @empty {
              <p class="none">No rows were removed.</p>
            }
          </div>
        </section>
      </div>
    } @else {
      <p class="lead">Choose a snapshot in the Compare panel to see which rows changed.</p>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; min-height: 0; flex: 1; }
    .lead { font-size: var(--text-13); color: var(--text-muted); }
    .lead strong { color: var(--text); font-weight: var(--weight-semi); }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex: 1; min-height: 0; }
    .side {
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-tile);
      overflow: hidden;
    }
    h3 {
      display: flex;
      justify-content: space-between;
      padding: 12px 14px;
      font-size: var(--text-14);
      border-bottom: 1px solid var(--border);
    }
    .added h3 { color: var(--success); box-shadow: inset 3px 0 0 var(--success); }
    .removed h3 { color: var(--error); box-shadow: inset 3px 0 0 var(--error); }
    .rows { overflow: auto; flex: 1; }
    .row {
      display: flex;
      gap: 16px;
      padding: 8px 14px;
      border-bottom: 1px solid var(--border-sub);
      font-size: var(--text-12);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .added .row { box-shadow: inset 3px 0 0 var(--success-wash); }
    .removed .row { box-shadow: inset 3px 0 0 var(--error-wash); }
    .cell { flex: 0 0 auto; min-width: 72px; color: var(--text-soft); }
    .none { padding: 16px 14px; font-size: var(--text-13); color: var(--text-muted); }
    @media (max-width: 1100px) { .split { grid-template-columns: 1fr; } }
  `,
})
export class DiffViewComponent {
  protected readonly diff = inject(DiffService);
  protected readonly previewRows = PREVIEW_ROWS;
  protected readonly added = computed(() => this.diff.result()?.added.slice(0, PREVIEW_ROWS) ?? []);
  protected readonly removed = computed(() => this.diff.result()?.removed.slice(0, PREVIEW_ROWS) ?? []);

  protected format(row: Record<string, unknown>, column: string): string {
    const value = row[column];
    return value === undefined || value === null ? '—' : String(value);
  }
}
