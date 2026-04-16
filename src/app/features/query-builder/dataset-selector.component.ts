import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  protected readonly datasets = this.store.availableDatasets;

  protected select(id: string): void {
    this.store.setDataset(id);
  }
}
