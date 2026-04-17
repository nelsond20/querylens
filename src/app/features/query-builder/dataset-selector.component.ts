import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Dataset } from '../../core/datasets/dataset.model';
import { QueryStore } from '../../store/query.store';
import { QlSelectComponent, SelectOption } from '../../shared/ui/ql-select/ql-select.component';

@Component({
  selector: 'app-dataset-selector',
  standalone: true,
  imports: [CommonModule, QlSelectComponent],
  templateUrl: './dataset-selector.component.html',
  styleUrl: './dataset-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetSelectorComponent {
  @Input() mode: 'demo' | 'live' = 'live';

  protected readonly store = inject(QueryStore);

  get datasets(): Dataset[] {
    const all = this.store.availableDatasets();
    if (this.mode === 'demo') {
      return all.filter((dataset) => dataset.source === 'built-in');
    }

    return all.filter((dataset) => dataset.source !== 'built-in');
  }

  get datasetOptions(): SelectOption[] {
    return this.datasets.map((d) => ({
      value: d.id,
      label: d.name + (d.source !== 'built-in' ? ' · imported' : ''),
    }));
  }

  protected select(id: string): void {
    this.store.setDataset(id);
    this.store.executeQuery();
  }
}
