import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldDefinition } from '../../core/datasets/field-definition.model';
import { FilterCondition } from '../../core/query-engine/filter-node.model';
import { Operator } from '../../core/query-engine/operator.model';
import { QlSelectComponent, SelectOption } from '../../shared/ui/ql-select/ql-select.component';

const OPERATORS_BY_TYPE: Record<FieldDefinition['type'], { value: Operator; label: string }[]> = {
  string: [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '!=' },
    { value: 'contains', label: 'contains' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'in', label: 'in list' },
    { value: 'notIn', label: 'not in list' },
  ],
  number: [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '!=' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'in', label: 'in list' },
    { value: 'notIn', label: 'not in list' },
  ],
  boolean: [{ value: 'eq', label: '=' }],
  date: [
    { value: 'eq', label: '=' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
  ],
};

@Component({
  selector: 'app-filter-condition',
  standalone: true,
  imports: [CommonModule, QlSelectComponent],
  templateUrl: './filter-condition.component.html',
  styleUrl: './filter-condition.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterConditionComponent implements OnChanges {
  @Input({ required: true }) condition!: FilterCondition;
  @Input({ required: true }) fields!: FieldDefinition[];
  @Output() conditionChange = new EventEmitter<FilterCondition>();
  @Output() remove = new EventEmitter<void>();

  protected readonly localValue = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['condition']) {
      this.localValue.set(this.valueAsText);
    }
  }

  get operators(): { value: Operator; label: string }[] {
    const field = this.fields.find((f) => f.key === this.condition.field);
    return field ? OPERATORS_BY_TYPE[field.type] : OPERATORS_BY_TYPE.string;
  }

  get fieldType(): FieldDefinition['type'] {
    return this.fields.find((f) => f.key === this.condition.field)?.type ?? 'string';
  }

  get fieldOptions(): SelectOption[] {
    return this.fields.map((f) => ({ value: f.key, label: f.label }));
  }

  get operatorOptions(): SelectOption[] {
    return this.operators.map((o) => ({ value: o.value, label: o.label }));
  }

  onInputChange(value: string): void {
    this.localValue.set(value);
  }

  updateField(field: string): void {
    const fieldDef = this.fields.find((f) => f.key === field);
    const operator = fieldDef ? OPERATORS_BY_TYPE[fieldDef.type][0].value : 'eq';
    this.conditionChange.emit({ ...this.condition, field, operator, value: '' });
  }

  updateOperator(operator: Operator): void {
    this.conditionChange.emit({ ...this.condition, operator });
  }

  updateValue(value: string): void {
    const fieldDef = this.fields.find((f) => f.key === this.condition.field);
    const operator = this.condition.operator;

    if (operator === 'in' || operator === 'notIn') {
      const parsedList = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      const normalized =
        fieldDef?.type === 'number' ? parsedList.map((item) => Number(item)) : parsedList;
      this.conditionChange.emit({ ...this.condition, value: normalized });
      return;
    }

    if (fieldDef?.type === 'number') {
      this.conditionChange.emit({ ...this.condition, value: Number(value) });
      return;
    }

    if (fieldDef?.type === 'boolean') {
      this.conditionChange.emit({ ...this.condition, value: value === 'true' });
      return;
    }

    this.conditionChange.emit({ ...this.condition, value });
  }

  get valueAsText(): string {
    if (Array.isArray(this.condition.value)) {
      return this.condition.value.join(', ');
    }
    return String(this.condition.value ?? '');
  }

  get inputPlaceholder(): string {
    if (this.condition.operator === 'in' || this.condition.operator === 'notIn') {
      return 'value1, value2, value3';
    }
    return 'value';
  }
}
