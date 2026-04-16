import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DATASETS } from '../../core/datasets/datasets.registry';
import { QueryStore } from '../../store/query.store';

@Component({
  selector: 'app-dataset-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dataset-selector.component.html',
  styleUrl: './dataset-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetSelectorComponent {
  protected readonly store = inject(QueryStore);
  protected readonly datasets = DATASETS;

  protected select(id: string): void {
    this.store.setDataset(id);
  }
}
