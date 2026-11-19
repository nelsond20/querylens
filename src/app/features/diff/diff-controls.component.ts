import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { WorkspaceUiService } from '../../pages/workspace-page/workspace-ui.service';
import { HistoryStore } from '../../store/history.store';
import { QlSelectComponent, SelectOption } from '../../shared/ui/ql-select/ql-select.component';
import { DiffService } from './diff.service';

@Component({
  selector: 'app-diff-controls',
  standalone: true,
  imports: [QlSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (options().length === 0) {
      <div class="empty">
        <p>Save a snapshot in History first. Then come back to see which rows changed since.</p>
        <button type="button" class="btn btn--ghost btn--sm" (click)="ui.open('history')">Open History</button>
      </div>
    } @else {
      <label class="field-label" for="diff-snapshot">Snapshot to compare against</label>
      <ql-select
        id="diff-snapshot"
        [options]="options()"
        [value]="ui.compareSnapshotId()"
        placeholder="Choose a snapshot"
        (valueChange)="pick($any($event))"
      />

      @if (diff.result(); as result) {
        <dl class="stats">
          <div class="stat added"><dt>Added</dt><dd class="num">+{{ result.added.length }}</dd></div>
          <div class="stat removed"><dt>Removed</dt><dd class="num">−{{ result.removed.length }}</dd></div>
          <div class="stat"><dt>Unchanged</dt><dd class="num">{{ result.unchanged.length }}</dd></div>
        </dl>
        <button type="button" class="btn btn--ghost btn--sm" (click)="ui.mainTab.set('diff')">Show the changed rows</button>
      }
    }
  `,
  styles: `
    :host { display: grid; gap: 10px; }
    .empty { display: grid; gap: 10px; justify-items: start; font-size: var(--text-13); color: var(--text-muted); }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 6px; }
    .stat {
      padding: 10px;
      border-radius: var(--r-cond);
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .stat dt { font-size: var(--text-11); color: var(--text-muted); }
    .stat dd { font-family: var(--font-display); font-size: var(--text-20); font-weight: 600; }
    .added { border-color: transparent; background: var(--success-wash); }
    .added dd { color: var(--success); }
    .removed { border-color: transparent; background: var(--error-wash); }
    .removed dd { color: var(--error); }
    .btn { justify-self: start; }
  `,
})
export class DiffControlsComponent {
  protected readonly ui = inject(WorkspaceUiService);
  protected readonly diff = inject(DiffService);
  private readonly historyStore = inject(HistoryStore);

  protected readonly options = computed<SelectOption[]>(() =>
    this.historyStore.entries().map((e) => ({ value: e.id, label: `${e.name} (${e.datasetId})` })),
  );

  protected pick(id: string): void {
    this.ui.compareSnapshotId.set(id);
    this.ui.mainTab.set('diff');
  }
}
