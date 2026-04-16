import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getDataset } from '../../core/datasets/datasets.registry';
import { AggregateOp, Transformation } from '../../core/query-engine/transformation.model';
import { QueryStore } from '../../store/query.store';

@Component({
  selector: 'app-transform-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transform-panel.component.html',
  styleUrl: './transform-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransformPanelComponent {
  protected readonly store = inject(QueryStore);
  protected readonly expanded = signal(false);

  protected readonly type = signal<'map' | 'groupBy' | 'sort'>('sort');
  protected readonly sortField = signal('');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly mapFields = signal<string[]>([]);
  protected readonly groupField = signal('');
  protected readonly groupAggregate = signal<AggregateOp>('count');
  protected readonly groupValueField = signal('');

  get fields() {
    return getDataset(this.store.selectedDatasetId()).fields;
  }

  protected toggle(): void {
    this.expanded.update((value) => !value);
  }

  protected apply(): void {
    let transformation: Transformation;

    switch (this.type()) {
      case 'sort':
        transformation = {
          type: 'sort',
          field: this.sortField() || this.fields[0].key,
          direction: this.sortDirection(),
        };
        break;
      case 'map':
        transformation = {
          type: 'map',
          fields: this.mapFields().length > 0 ? this.mapFields() : this.fields.map((f) => f.key),
        };
        break;
      case 'groupBy':
        transformation = {
          type: 'groupBy',
          field: this.groupField() || this.fields[0].key,
          aggregate: this.groupAggregate(),
          valueField: this.groupValueField() || undefined,
        };
        break;
    }

    this.store.applyTransformation(transformation);
  }

  protected toggleMapField(key: string): void {
    const current = this.mapFields();
    this.mapFields.set(current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }
}
