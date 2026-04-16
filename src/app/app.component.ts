import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FilterGroup } from './core/query-engine/filter-node.model';
import { Transformation } from './core/query-engine/transformation.model';
import { deserialize, serialize } from './core/serialization/query-serializer';
import { DataSourcesPanelComponent } from './features/data-sources/data-sources-panel.component';
import { DiffPanelComponent } from './features/diff/diff-panel.component';
import { HistoryPanelComponent } from './features/history/history-panel.component';
import { DatasetSelectorComponent } from './features/query-builder/dataset-selector.component';
import { QueryBuilderComponent } from './features/query-builder/query-builder.component';
import { QueryEditorComponent } from './features/query-editor/query-editor.component';
import { ResultsTableComponent } from './features/results-table/results-table.component';
import { TransformPanelComponent } from './features/transformations/transform-panel.component';
import { QueryStore } from './store/query.store';

interface QueryPreset {
  id: string;
  title: string;
  description: string;
  datasetId: string;
  filterTree: FilterGroup;
  transformation: Transformation | null;
}

const QUERY_PRESETS: QueryPreset[] = [
  {
    id: 'high-value-events',
    title: 'High-Value Events',
    description: 'Find purchase events with value above 100 and sort by highest value first.',
    datasetId: 'events',
    filterTree: {
      type: 'group',
      op: 'AND',
      children: [
        { type: 'condition', field: 'type', operator: 'eq', value: 'purchase' },
        { type: 'condition', field: 'value', operator: 'gt', value: 100 },
      ],
    },
    transformation: { type: 'sort', field: 'value', direction: 'desc' },
  },
  {
    id: 'inactive-admins',
    title: 'Inactive Admin Accounts',
    description: 'Surface admin users currently inactive to trigger recovery actions.',
    datasetId: 'users',
    filterTree: {
      type: 'group',
      op: 'AND',
      children: [
        { type: 'condition', field: 'role', operator: 'eq', value: 'admin' },
        { type: 'condition', field: 'status', operator: 'eq', value: 'inactive' },
      ],
    },
    transformation: { type: 'sort', field: 'createdAt', direction: 'asc' },
  },
  {
    id: 'low-stock-catalog',
    title: 'Low Stock Watchlist',
    description: 'Track products with low inventory and prioritize highest-rated items first.',
    datasetId: 'products',
    filterTree: {
      type: 'group',
      op: 'AND',
      children: [{ type: 'condition', field: 'stock', operator: 'lt', value: 30 }],
    },
    transformation: { type: 'sort', field: 'rating', direction: 'desc' },
  },
];

@Component({
  selector: 'app-root',
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
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  protected readonly store = inject(QueryStore);
  protected readonly presets = QUERY_PRESETS;
  protected readonly activePresetId = signal<string>('');
  protected readonly selectedDataset = this.store.selectedDataset;

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
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('q');

    if (!queryParam) {
      return;
    }

    const parsed = deserialize(queryParam);
    if (!parsed) {
      return;
    }

    if (!this.store.hasDataset(parsed.datasetId)) {
      return;
    }

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
  }

  protected runPreset(preset: QueryPreset): void {
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

  protected shareUrl(): void {
    const encoded = serialize({
      datasetId: this.store.selectedDatasetId(),
      filterTree: this.store.filterTree(),
      transformation: this.store.transformation(),
    });

    const url = `${window.location.origin}${window.location.pathname}?q=${encoded}`;
    navigator.clipboard.writeText(url);
  }
}
