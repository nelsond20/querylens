import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { buildBreakdown, buildTimeline, eligibleCategoryFields } from '../../core/insights/bento-data';
import { Transformation } from '../../core/query-engine/transformation.model';
import { QueryStore, WORKER_ROW_THRESHOLD } from '../../store/query.store';
import { ScenarioRunnerService } from '../scenarios/scenario-runner.service';
import { BreakdownTreemapComponent } from './breakdown-treemap.component';
import { MetricTileComponent } from './metric-tile.component';
import { TimelineChartComponent } from './timeline-chart.component';

export function transformationLabel(t: Transformation, labels: Record<string, string>): string {
  const name = (key: string) => labels[key] ?? key;
  if (t.type === 'sort') {
    return `Sorted by ${name(t.field)} ${t.direction === 'asc' ? '↑' : '↓'}`;
  }
  if (t.type === 'map') {
    return `${t.fields.length} field${t.fields.length === 1 ? '' : 's'} kept`;
  }
  const value = t.aggregate === 'count' ? 'count' : `${t.aggregate} of ${name(t.valueField ?? '')}`;
  return `Grouped by ${name(t.field)} (${value})`;
}

@Component({
  selector: 'app-results-bento',
  standalone: true,
  imports: [MetricTileComponent, TimelineChartComponent, BreakdownTreemapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-bento.component.html',
  styleUrl: './results-bento.component.css',
})
export class ResultsBentoComponent {
  protected readonly store = inject(QueryStore);
  private readonly runner = inject(ScenarioRunnerService);

  private readonly dataset = this.store.selectedDataset;
  protected readonly labels = computed<Record<string, string>>(() =>
    Object.fromEntries(this.dataset().fields.map((f) => [f.key, f.label])),
  );

  protected readonly title = computed(() => this.runner.activeScenario()?.title ?? 'Custom query');
  protected readonly subtitle = computed(() => {
    const ds = this.dataset();
    const kind = ds.source === 'built-in' ? 'sample data' : 'your data';
    return `${ds.name}, ${kind}, ${ds.rows.length.toLocaleString('en-US')} rows`;
  });
  protected readonly transformChip = computed(() => {
    const t = this.store.transformation();
    return t ? transformationLabel(t, this.labels()) : null;
  });

  protected readonly hasRun = computed(() => this.store.lastExecutionMs() !== null);
  protected readonly execSub = computed(() =>
    this.dataset().rows.length > WORKER_ROW_THRESHOLD ? 'in a Web Worker' : 'on the main thread',
  );

  // Charts read the filtered, untransformed results: groupBy/map outputs lose the original fields.
  private readonly eligible = computed(() => eligibleCategoryFields(this.dataset().fields, this.dataset().rows));
  private readonly chosenField = signal<string | undefined>(undefined);
  protected readonly breakdown = computed(() =>
    this.hasRun() ? buildBreakdown(this.eligible(), this.store.results(), this.chosenField()) : null,
  );
  protected readonly timeline = computed(() =>
    this.hasRun() ? buildTimeline(this.dataset().fields, this.dataset().rows, this.store.results()) : null,
  );

  protected readonly announcement = computed(() =>
    this.hasRun()
      ? `${this.store.resultCount().toLocaleString('en-US')} rows returned in ${this.store.lastExecutionMs()} ms`
      : '',
  );

  constructor() {
    effect(() => {
      this.dataset();
      this.chosenField.set(undefined);
    });
  }

  protected chooseField(field: string): void {
    this.chosenField.set(field);
  }
}
