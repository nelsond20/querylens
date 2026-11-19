import { A11yModule } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Dataset } from '../../core/datasets/dataset.model';
import { WorkspaceUiService } from '../../pages/workspace-page/workspace-ui.service';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';
import { QueryStore } from '../../store/query.store';

export interface DatasetGroup {
  label: string;
  datasets: Dataset[];
}

@Component({
  selector: 'app-dataset-selector',
  standalone: true,
  imports: [A11yModule, CdkConnectedOverlay, CdkOverlayOrigin, QlIconComponent],
  templateUrl: './dataset-selector.component.html',
  styleUrl: './dataset-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetSelectorComponent {
  protected readonly store = inject(QueryStore);
  private readonly ui = inject(WorkspaceUiService);

  protected readonly open = signal(false);
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  ];

  readonly groups = computed<DatasetGroup[]>(() =>
    [
      { label: 'Sample data', datasets: this.store.availableDatasets().filter((d) => d.source === 'built-in') },
      { label: 'Your data', datasets: this.store.availableDatasets().filter((d) => d.source !== 'built-in') },
    ].filter((group) => group.datasets.length > 0),
  );

  protected readonly current = this.store.selectedDataset;

  protected select(id: string): void {
    this.open.set(false);
    if (id !== this.store.selectedDatasetId()) {
      this.store.setDataset(id);
      this.store.executeQuery();
    }
  }

  /** Arrow keys move between options; Home/End jump; Tab is trapped by cdkTrapFocus, Escape closes. */
  protected onMenuKeydown(event: KeyboardEvent): void {
    const menu = event.currentTarget as HTMLElement;
    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('.option'));
    const index = options.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % options.length;
    else if (event.key === 'ArrowUp') next = index <= 0 ? options.length - 1 : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    if (next !== null) {
      event.preventDefault();
      options[next]?.focus();
    }
  }

  protected importData(): void {
    this.open.set(false);
    this.ui.open('sources');
  }

  protected rows(dataset: Dataset): string {
    return dataset.rows.length.toLocaleString('en-US');
  }
}
