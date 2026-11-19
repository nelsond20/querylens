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
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, QlIconComponent],
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

  protected importData(): void {
    this.open.set(false);
    this.ui.open('sources');
  }

  protected rows(dataset: Dataset): string {
    return dataset.rows.length.toLocaleString('en-US');
  }
}
