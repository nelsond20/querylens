import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../../core/theme.service';
import { ExportService } from '../../../features/results-table/export.service';
import { ScenarioRunnerService } from '../../../features/scenarios/scenario-runner.service';
import { ShareService } from '../../../features/share/share.service';
import { WorkspaceUiService } from '../../../pages/workspace-page/workspace-ui.service';
import { QueryStore } from '../../../store/query.store';
import { IconName } from '../ql-icon/ql-icon.component';

export type CommandGroup = 'Actions' | 'Scenarios' | 'Datasets' | 'Navigate';

export interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  icon?: IconName;
  shortcut?: string;
  run(): void;
}

@Injectable({ providedIn: 'root' })
export class CommandRegistryService {
  private readonly store = inject(QueryStore);
  private readonly ui = inject(WorkspaceUiService);
  private readonly runner = inject(ScenarioRunnerService);
  private readonly share = inject(ShareService);
  private readonly exporter = inject(ExportService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly open = signal(false);
  readonly isOpen = this.open.asReadonly();

  readonly modKey = /Mac|iPhone|iPad/.test(globalThis.navigator?.userAgent ?? '') ? '⌘' : 'Ctrl';

  readonly commands = computed<Command[]>(() => {
    const actions: Command[] = [
      { id: 'run', label: 'Run query', group: 'Actions', icon: 'play', shortcut: `${this.modKey} ↵`, run: () => this.runQuery() },
      { id: 'reset', label: 'Reset query', group: 'Actions', icon: 'x', run: () => this.store.clearQuery() },
      { id: 'save', label: 'Save snapshot', group: 'Actions', icon: 'history', run: () => this.focusSnapshotName() },
      { id: 'share', label: 'Copy share link', group: 'Actions', icon: 'link', run: () => void this.share.copyLink() },
      { id: 'csv', label: 'Export CSV', group: 'Actions', icon: 'download', run: () => this.exporter.csv() },
      { id: 'json', label: 'Export JSON', group: 'Actions', icon: 'download', run: () => this.exporter.json() },
      { id: 'import', label: 'Import data', group: 'Actions', icon: 'upload', run: () => this.ui.open('sources') },
      {
        id: 'theme',
        label: this.theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme',
        group: 'Actions',
        icon: this.theme.isDark() ? 'sun' : 'moon',
        run: () => this.theme.toggle(),
      },
    ];

    const scenarios: Command[] = this.runner.scenarios.map((s) => ({
      id: `scenario:${s.id}`,
      label: `Run scenario: ${s.title}`,
      group: 'Scenarios',
      icon: 'sparkle',
      run: () => this.runner.run(s.id),
    }));

    const datasets: Command[] = this.store.availableDatasets().map((d) => ({
      id: `dataset:${d.id}`,
      label: `Switch to ${d.name}${d.source === 'built-in' ? '' : ' (yours)'}`,
      group: 'Datasets',
      icon: 'database',
      run: () => {
        this.store.setDataset(d.id);
        this.store.executeQuery();
      },
    }));

    const navigate: Command[] = [
      { id: 'nav:query', label: 'Open Query', group: 'Navigate', icon: 'filter', run: () => this.ui.open('query') },
      { id: 'nav:transform', label: 'Open Transform', group: 'Navigate', icon: 'transform', run: () => this.ui.open('transform') },
      { id: 'nav:history', label: 'Open History', group: 'Navigate', icon: 'history', run: () => this.ui.open('history') },
      { id: 'nav:compare', label: 'Open Compare', group: 'Navigate', icon: 'compare', run: () => this.ui.open('compare') },
      { id: 'nav:sources', label: 'Open Your data', group: 'Navigate', icon: 'database', run: () => this.ui.open('sources') },
      { id: 'nav:settings', label: 'Go to Settings', group: 'Navigate', icon: 'settings', run: () => void this.router.navigate(['/settings']) },
    ];

    return [...actions, ...scenarios, ...datasets, ...navigate];
  });

  show(): void {
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  runQuery(): void {
    if (!this.store.rawQueryError() && !this.store.isExecuting()) {
      this.store.executeQuery();
    }
  }

  private focusSnapshotName(): void {
    this.ui.open('history');
    setTimeout(() => document.getElementById('snapshot-name')?.focus());
  }
}
