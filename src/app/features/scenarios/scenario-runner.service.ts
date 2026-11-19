import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { FIRST_SCENARIO_ID, Scenario, SCENARIOS } from '../../core/scenarios/scenarios';
import { QueryStore } from '../../store/query.store';

@Injectable({ providedIn: 'root' })
export class ScenarioRunnerService {
  private readonly store = inject(QueryStore);
  private firstRunDone = false;

  readonly scenarios = SCENARIOS;
  readonly activeScenarioId = signal('');
  readonly activeScenario = computed<Scenario | null>(
    () => SCENARIOS.find((s) => s.id === this.activeScenarioId()) ?? null,
  );

  constructor() {
    // Editing the filters or switching dataset turns a scenario into a custom query.
    effect(() => {
      const tree = this.store.filterTree();
      const datasetId = this.store.selectedDatasetId();
      const active = untracked(this.activeScenario);
      if (!active) {
        return;
      }
      if (active.datasetId !== datasetId || JSON.stringify(active.filterTree) !== JSON.stringify(tree)) {
        this.activeScenarioId.set('');
      }
    });
  }

  run(id: string): void {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (!scenario || !this.store.hasDataset(scenario.datasetId)) {
      return;
    }
    this.firstRunDone = true;
    this.store.hydrateFrom({
      selectedDatasetId: scenario.datasetId,
      filterTree: scenario.filterTree,
      rawQuery: JSON.stringify(scenario.filterTree, null, 2),
      rawQueryError: null,
      transformation: null,
      transformedResults: [],
    });
    this.store.executeQuery();
    if (scenario.transformation) {
      this.store.applyTransformation(scenario.transformation);
    }
    this.activeScenarioId.set(id);
  }

  /** Runs the first scenario once per session, unless something was already run or loaded. */
  ensureFirstRun(): void {
    if (this.firstRunDone) {
      return;
    }
    this.firstRunDone = true;
    if (this.store.lastExecutedAt() === null) {
      this.run(FIRST_SCENARIO_ID);
    }
  }

  /** Something else (a shared link, a snapshot) populated the workspace first. */
  markFirstRunDone(): void {
    this.firstRunDone = true;
  }
}
