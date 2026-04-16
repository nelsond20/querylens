import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { deserialize, serialize } from './core/serialization/query-serializer';
import { DiffPanelComponent } from './features/diff/diff-panel.component';
import { HistoryPanelComponent } from './features/history/history-panel.component';
import { QueryBuilderComponent } from './features/query-builder/query-builder.component';
import { DatasetSelectorComponent } from './features/query-builder/dataset-selector.component';
import { QueryEditorComponent } from './features/query-editor/query-editor.component';
import { ResultsTableComponent } from './features/results-table/results-table.component';
import { TransformPanelComponent } from './features/transformations/transform-panel.component';
import { QueryStore } from './store/query.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
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
