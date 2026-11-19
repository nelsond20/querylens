import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Dataset } from '../../core/datasets/dataset.model';
import { QueryStore } from '../../store/query.store';
import { QlSelectComponent, SelectOption } from '../../shared/ui/ql-select/ql-select.component';

export interface DatasetGroup {
  label: string;
  datasets: Dataset[];
}

@Component({
  selector: 'app-dataset-selector',
  standalone: true,
  imports: [QlSelectComponent],
  templateUrl: './dataset-selector.component.html',
  styleUrl: './dataset-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetSelectorComponent {
  protected readonly store = inject(QueryStore);

  readonly groups = computed<DatasetGroup[]>(() =>
    [
      { label: 'Sample data', datasets: this.store.availableDatasets().filter((d) => d.source === 'built-in') },
      { label: 'Your data', datasets: this.store.availableDatasets().filter((d) => d.source !== 'built-in') },
    ].filter((group) => group.datasets.length > 0),
  );

  protected readonly options = computed<SelectOption[]>(() =>
    this.groups().flatMap((group) =>
      group.datasets.map((d) => ({ value: d.id, label: `${d.name}${group.label === 'Your data' ? ' (yours)' : ''}` })),
    ),
  );

  protected select(id: string): void {
    this.store.setDataset(id);
    this.store.executeQuery();
  }
}
