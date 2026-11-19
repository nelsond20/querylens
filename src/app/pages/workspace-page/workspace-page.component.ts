import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Scenario, SCENARIOS } from '../../core/scenarios/scenarios';
import { deserialize } from '../../core/serialization/query-serializer';
import { DataSourcesPanelComponent } from '../../features/data-sources/data-sources-panel.component';
import { DiffPanelComponent } from '../../features/diff/diff-panel.component';
import { HistoryPanelComponent } from '../../features/history/history-panel.component';
import { DatasetSelectorComponent } from '../../features/query-builder/dataset-selector.component';
import { QueryBuilderComponent } from '../../features/query-builder/query-builder.component';
import { QueryEditorComponent } from '../../features/query-editor/query-editor.component';
import { ResultsTableComponent } from '../../features/results-table/results-table.component';
import { TransformPanelComponent } from '../../features/transformations/transform-panel.component';
import { QueryStore } from '../../store/query.store';

const MAX_SHARED_QUERY_PARAM_LENGTH = 16000;

@Component({
  selector: 'app-workspace-page',
  standalone: true,
  imports: [
    CommonModule,
    DataSourcesPanelComponent,
    DatasetSelectorComponent,
    QueryBuilderComponent,
    QueryEditorComponent,
    ResultsTableComponent,
    TransformPanelComponent,
    DiffPanelComponent,
    HistoryPanelComponent,
  ],
  templateUrl: './workspace-page.component.html',
  styleUrl: './workspace-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(QueryStore);
  protected readonly presets = SCENARIOS;
  protected readonly activePresetId = signal<string>('');
  protected readonly historyExpanded = signal(true);
  protected readonly diffExpanded = signal(false);
  protected readonly selectedDataset = this.store.selectedDataset;

  private readonly hydratedQueryToken = signal<string | null>(null);

  protected readonly activeDatasetName = computed(() => this.selectedDataset().name);
  protected readonly activeDatasetDescription = computed(() => this.selectedDataset().description);
  protected readonly transformationLabel = computed(() => {
    const transformation = this.store.transformation();
    if (!transformation) {
      return 'None';
    }

    if (transformation.type === 'sort') {
      return `Sort by ${transformation.field} (${transformation.direction})`;
    }

    if (transformation.type === 'map') {
      return `Map ${transformation.fields.length} fields`;
    }

    return `Group by ${transformation.field} (${transformation.aggregate})`;
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const queryParam = params.get('q');
      if (!queryParam || this.hydratedQueryToken() === queryParam) {
        return;
      }

      if (queryParam.length > MAX_SHARED_QUERY_PARAM_LENGTH) {
        return;
      }

      const parsed = deserialize(queryParam);
      if (!parsed || !this.store.hasDataset(parsed.datasetId)) {
        return;
      }

      this.hydratedQueryToken.set(queryParam);
      this.store.hydrateFrom({
        selectedDatasetId: parsed.datasetId,
        filterTree: parsed.filterTree,
        rawQuery: JSON.stringify(parsed.filterTree, null, 2),
        rawQueryError: null,
        transformation: parsed.transformation,
      });

      this.store.executeQuery();
      if (parsed.transformation) {
        this.store.applyTransformation(parsed.transformation);
      }
    });
  }

  protected runPreset(preset: Scenario): void {
    this.activePresetId.set(preset.id);
    this.store.hydrateFrom({
      selectedDatasetId: preset.datasetId,
      filterTree: preset.filterTree,
      rawQuery: JSON.stringify(preset.filterTree, null, 2),
      rawQueryError: null,
      transformation: null,
      transformedResults: [],
      activeTab: 'history',
    });

    this.store.executeQuery();
    if (preset.transformation) {
      this.store.applyTransformation(preset.transformation);
    }
  }

  protected toggleHistory(): void {
    this.historyExpanded.update((value) => !value);
  }

  protected toggleDiff(): void {
    this.diffExpanded.update((value) => !value);
  }
}
