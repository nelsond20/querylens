import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { QueryStore } from '../../store/query.store';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';
import { ScenarioRunnerService } from './scenario-runner.service';

@Component({
  selector: 'app-scenario-list',
  standalone: true,
  imports: [QlIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="scenarios" aria-labelledby="scenarios-title">
      <button type="button" class="head" (click)="expanded.set(!expanded())" [attr.aria-expanded]="isOpen()">
        <span id="scenarios-title" class="title">Scenarios</span>
        <span class="hint">{{ isOpen() ? 'One click runs a ready-made query' : summary() }}</span>
        <ql-icon class="chev" [class.open]="isOpen()" name="chevron-down" [size]="14" />
      </button>
      @if (isOpen()) {
        <ul class="list">
          @for (scenario of runner.scenarios; track scenario.id) {
            <li>
              <button
                type="button"
                class="item"
                [class.active]="runner.activeScenarioId() === scenario.id"
                [attr.aria-current]="runner.activeScenarioId() === scenario.id ? 'true' : null"
                (click)="runner.run(scenario.id)"
              >
                <span class="name">{{ scenario.title }}</span>
                <span class="desc">{{ scenario.description }}</span>
                <span class="chip">{{ datasetName(scenario.datasetId) }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .scenarios { display: grid; gap: 8px; }
    .head {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: baseline;
      gap: 8px;
      text-align: left;
      padding: 2px 0;
    }
    .title { font-size: var(--text-13); font-weight: var(--weight-semi); color: var(--text); }
    .hint {
      font-size: var(--text-12);
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chev { color: var(--text-muted); transition: transform var(--dur-base) var(--ease-expo); align-self: center; }
    .chev.open { transform: rotate(180deg); }
    .list { list-style: none; display: grid; gap: 6px; }
    .item {
      display: grid;
      gap: 2px;
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      border-radius: var(--r-cond);
      border: 1px solid var(--border);
      background: var(--surface);
      transition: border-color var(--dur-fast), background-color var(--dur-fast);
    }
    .item:hover { border-color: var(--text-muted); }
    .item.active {
      border-color: var(--stage-filter);
      background: var(--stage-filter-wash);
    }
    .name { font-size: var(--text-13); font-weight: var(--weight-semi); }
    .desc { font-size: var(--text-12); color: var(--text-muted); line-height: 1.4; }
    .chip { justify-self: start; margin-top: 4px; }
  `,
})
export class ScenarioListComponent {
  protected readonly runner = inject(ScenarioRunnerService);
  private readonly store = inject(QueryStore);

  /** Expanded by default; collapses to one line once the user starts editing a custom query. */
  protected readonly expanded = signal<boolean | null>(null);
  protected readonly isOpen = computed(() => this.expanded() ?? (this.runner.activeScenarioId() !== '' || this.store.filterIsEmpty()));
  protected readonly summary = computed(() => {
    const active = this.runner.activeScenario();
    return active ? active.title : `${this.runner.scenarios.length} ready-made queries`;
  });

  protected datasetName(id: string): string {
    return this.store.findDataset(id)?.name ?? id;
  }
}
