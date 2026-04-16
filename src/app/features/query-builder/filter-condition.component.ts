import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FieldDefinition } from '../../core/datasets/field-definition.model';
import { FilterCondition } from '../../core/query-engine/filter-node.model';
import { Operator } from '../../core/query-engine/operator.model';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-condition.component.html',
  styleUrl: './filter-condition.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterConditionComponent {
  @Input({ required: true }) condition!: FilterCondition;
  @Input({ required: true }) fields!: FieldDefinition[];
  @Output() conditionChange = new EventEmitter<FilterCondition>();
  @Output() remove = new EventEmitter<void>();

  get operators(): { value: Operator; label: string }[] {
    const field = this.fields.find((f) => f.key === this.condition.field);
    return field ? OPERATORS_BY_TYPE[field.type] : OPERATORS_BY_TYPE.string;
  }

  get fieldType(): FieldDefinition['type'] {
    return this.fields.find((f) => f.key === this.condition.field)?.type ?? 'string';
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
}
