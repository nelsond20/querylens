import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AggregateOp, Transformation } from '../../core/query-engine/transformation.model';
import { QueryStore } from '../../store/query.store';
import { QlSelectComponent, SelectOption } from '../../shared/ui/ql-select/ql-select.component';

@Component({
  selector: 'app-transform-panel',
  standalone: true,
  imports: [CommonModule, QlSelectComponent],
  templateUrl: './transform-panel.component.html',
  styleUrl: './transform-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransformPanelComponent {
  protected readonly store = inject(QueryStore);
  protected readonly expanded = signal(true);

  protected readonly type = signal<'map' | 'groupBy' | 'sort'>('sort');

  readonly typeOptions: SelectOption[] = [
    { value: 'sort', label: 'Sort' },
    { value: 'map', label: 'Map (select fields)' },
    { value: 'groupBy', label: 'Group By' },
  ];
  readonly directionOptions: SelectOption[] = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];
  readonly aggregateOptions: SelectOption[] = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
  ];
  protected readonly sortField = signal('');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly mapFields = signal<string[]>([]);
  protected readonly groupField = signal('');
  protected readonly groupAggregate = signal<AggregateOp>('count');
  protected readonly groupValueField = signal('');

  get fields() {
    return this.store.selectedDataset().fields;
  }

  get fieldOptions(): SelectOption[] {
    return this.fields.map((f) => ({ value: f.key, label: f.label }));
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

  protected clearTransformation(): void {
    this.store.clearTransformation();
  }

  protected toggleMapField(key: string): void {
    const current = this.mapFields();
    this.mapFields.set(current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }
}
