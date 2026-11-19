import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { isTypingTarget } from '../../core/keyboard';
import { deserialize } from '../../core/serialization/query-serializer';
import { DataSourcesPanelComponent } from '../../features/data-sources/data-sources-panel.component';
import { DiffControlsComponent } from '../../features/diff/diff-controls.component';
import { DiffViewComponent } from '../../features/diff/diff-view.component';
import { OnboardingService } from '../../features/onboarding/onboarding.service';
import { OrientationStripComponent } from '../../features/onboarding/orientation-strip.component';
import { TourComponent } from '../../features/onboarding/tour.component';
import { HistoryPanelComponent } from '../../features/history/history-panel.component';
import { DatasetSelectorComponent } from '../../features/query-builder/dataset-selector.component';
import { QueryBuilderComponent } from '../../features/query-builder/query-builder.component';
import { QueryEditorComponent } from '../../features/query-editor/query-editor.component';
import { ResultsBentoComponent } from '../../features/results-bento/results-bento.component';
import { ResultsTableComponent } from '../../features/results-table/results-table.component';
import { ScenarioListComponent } from '../../features/scenarios/scenario-list.component';
import { ScenarioRunnerService } from '../../features/scenarios/scenario-runner.service';
import { ShareService } from '../../features/share/share.service';
import { CommandPaletteComponent } from '../../shared/ui/ql-command-palette/command-palette.component';
import { CommandRegistryService } from '../../shared/ui/ql-command-palette/command-registry.service';
import { ToastService } from '../../shared/ui/ql-toast/toast.service';
import { TransformPanelComponent } from '../../features/transformations/transform-panel.component';
import { AppRailComponent } from '../../shared/layout/app-rail.component';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';
import { QlSegmentedComponent, SegmentedOption } from '../../shared/ui/ql-segmented/ql-segmented.component';
import { QueryStore } from '../../store/query.store';
import { RailItem, WorkspaceUiService } from './workspace-ui.service';

const MAX_SHARED_QUERY_PARAM_LENGTH = 16000;

const PANEL_COPY: Record<RailItem, { title: string; description: string }> = {
  query: { title: 'Query', description: 'Build filters visually or edit them as JSON.' },
  transform: { title: 'Transform', description: 'Sort, reshape or group the current results.' },
  history: { title: 'History', description: 'Save the current query as a snapshot and reload it later.' },
  compare: {
    title: 'Compare',
    description: 'See which rows changed between the current result and a saved snapshot.',
  },
  sources: {
    title: 'Your data',
    description: 'Import a JSON file or fetch records from an API. Data stays in this browser.',
  },
};

@Component({
  selector: 'app-workspace-page',
  standalone: true,
  imports: [
    AppRailComponent,
    CommandPaletteComponent,
    DataSourcesPanelComponent,
    DatasetSelectorComponent,
    DiffControlsComponent,
    DiffViewComponent,
    HistoryPanelComponent,
    OrientationStripComponent,
    TourComponent,
    QlIconComponent,
    QlSegmentedComponent,
    QueryBuilderComponent,
    QueryEditorComponent,
    ResultsBentoComponent,
    ResultsTableComponent,
    ScenarioListComponent,
    TransformPanelComponent,
  ],
  templateUrl: './workspace-page.component.html',
  styleUrl: './workspace-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class WorkspacePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(QueryStore);
  protected readonly ui = inject(WorkspaceUiService);
  protected readonly runner = inject(ScenarioRunnerService);
  protected readonly palette = inject(CommandRegistryService);
  protected readonly share = inject(ShareService);
  private readonly toast = inject(ToastService);
  protected readonly onboarding = inject(OnboardingService);

  protected readonly editorMode = signal<'visual' | 'json'>('visual');
  protected readonly editorOptions: SegmentedOption[] = [
    { value: 'visual', label: 'Visual' },
    { value: 'json', label: 'JSON' },
  ];
  protected readonly panelCopy = computed(() => PANEL_COPY[this.ui.activePanel()]);
  protected readonly modKey = this.palette.modKey;

  private readonly hydratedQueryToken = signal<string | null>(null);

  ngOnInit(): void {
    // On narrow screens the panel is a bottom sheet: start with the results visible.
    if (typeof matchMedia === 'function' && matchMedia('(max-width: 899px)').matches) {
      this.ui.panelOpen.set(false);
    }

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const queryParam = params.get('q');
      if (!queryParam || this.hydratedQueryToken() === queryParam) {
        return;
      }

      if (queryParam.length > MAX_SHARED_QUERY_PARAM_LENGTH) {
        return;
      }

      const parsed = deserialize(queryParam);
      if (!parsed) {
        return;
      }
      if (!this.store.hasDataset(parsed.datasetId)) {
        this.toast.show("That link uses a dataset that isn't in this browser");
        return;
      }

      this.hydratedQueryToken.set(queryParam);
      this.runner.markFirstRunDone();
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

    this.runner.ensureFirstRun();
  }

  protected run(): void {
    this.palette.runQuery();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.palette.toggle();
      return;
    }
    if (mod && event.key === 'Enter') {
      event.preventDefault();
      this.palette.runQuery();
      return;
    }
    if (this.palette.isOpen() || mod || event.altKey) {
      return;
    }
    if (event.key === '[' && !isTypingTarget(event.target as HTMLElement | null)) {
      event.preventDefault();
      this.ui.togglePanel();
    }
  }

  protected reset(): void {
    this.store.clearQuery();
  }
}
