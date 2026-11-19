import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { orientationSentence } from '../../core/orientation-copy';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';
import { CommandRegistryService } from '../../shared/ui/ql-command-palette/command-registry.service';
import { QueryStore } from '../../store/query.store';
import { ScenarioRunnerService } from '../scenarios/scenario-runner.service';
import { OnboardingService } from './onboarding.service';

@Component({
  selector: 'app-orientation-strip',
  standalone: true,
  imports: [QlIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="strip" role="note" aria-label="About this workspace">
      <ql-icon name="info" class="icon" />
      <p class="text">{{ sentence() }}</p>
      <button type="button" class="btn btn--ghost btn--sm" (click)="onboarding.startTour()">Take the 30-second tour</button>
      <button type="button" class="close" (click)="onboarding.dismissStrip()" aria-label="Dismiss" title="Dismiss">
        <ql-icon name="x" [size]="14" />
      </button>
    </div>
  `,
  styles: `
    .strip {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 8px 8px 14px;
      border-radius: var(--r-cond);
      background: var(--stage-filter-wash);
      border: 1px solid var(--border-sub);
    }
    .icon { color: var(--stage-filter); }
    .text { flex: 1; font-size: var(--text-13); color: var(--text); line-height: 1.45; }
    .close {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: var(--r-sm);
      color: var(--text-muted);
    }
    .close:hover { color: var(--text); background: var(--surface); }
    @media (max-width: 700px) {
      .strip { flex-wrap: wrap; }
      .text { flex-basis: calc(100% - 80px); }
    }
  `,
})
export class OrientationStripComponent {
  protected readonly onboarding = inject(OnboardingService);
  private readonly store = inject(QueryStore);
  private readonly runner = inject(ScenarioRunnerService);
  private readonly registry = inject(CommandRegistryService);

  protected readonly sentence = computed(() => {
    const ds = this.store.selectedDataset();
    return orientationSentence({
      datasetName: ds.name,
      rowCount: ds.rows.length,
      sample: ds.source === 'built-in',
      scenarioTitle: this.runner.activeScenario()?.title ?? null,
      modKey: this.registry.modKey,
    });
  });
}
