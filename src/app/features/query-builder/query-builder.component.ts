import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getDataset } from '../../core/datasets/datasets.registry';
import { FilterGroup } from '../../core/query-engine/filter-node.model';
import { QueryStore } from '../../store/query.store';
import { FilterGroupComponent } from './filter-group.component';

@Component({
  selector: 'app-query-builder',
  standalone: true,
  imports: [CommonModule, FilterGroupComponent],
  templateUrl: './query-builder.component.html',
  styleUrl: './query-builder.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderComponent {
  protected readonly store = inject(QueryStore);

  get fields() {
    return getDataset(this.store.selectedDatasetId()).fields;
  }

  protected updateTree(tree: FilterGroup): void {
    this.store.updateFilterTree(tree);
  }
}
