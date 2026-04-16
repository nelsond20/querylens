import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldDefinition } from '../../core/datasets/field-definition.model';
import { FilterCondition, FilterGroup, FilterNode } from '../../core/query-engine/filter-node.model';
import { FilterConditionComponent } from './filter-condition.component';

@Component({
  selector: 'app-filter-group',
  standalone: true,
  imports: [CommonModule, FilterConditionComponent, forwardRef(() => FilterGroupComponent)],
  templateUrl: './filter-group.component.html',
  styleUrl: './filter-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterGroupComponent {
  @Input({ required: true }) group!: FilterGroup;
  @Input({ required: true }) fields!: FieldDefinition[];
  @Input() depth = 0;
  @Output() groupChange = new EventEmitter<FilterGroup>();
  @Output() remove = new EventEmitter<void>();

  isGroup(node: FilterNode): node is FilterGroup {
    return node.type === 'group';
  }

  isCondition(node: FilterNode): node is FilterCondition {
    return node.type === 'condition';
  }

  toggleOp(): void {
    this.groupChange.emit({ ...this.group, op: this.group.op === 'AND' ? 'OR' : 'AND' });
  }

  addCondition(): void {
    const firstField = this.fields[0];
    if (!firstField) {
      return;
    }

    const condition: FilterCondition = {
      type: 'condition',
      field: firstField.key,
      operator: 'eq',
      value: '',
    };

    this.groupChange.emit({ ...this.group, children: [...this.group.children, condition] });
  }

  addGroup(): void {
    const nested: FilterGroup = { type: 'group', op: 'AND', children: [] };
    this.groupChange.emit({ ...this.group, children: [...this.group.children, nested] });
  }

  updateChild(index: number, updated: FilterNode): void {
    const children = this.group.children.map((child, current) => (current === index ? updated : child));
    this.groupChange.emit({ ...this.group, children });
  }

  removeChild(index: number): void {
    const children = this.group.children.filter((_, current) => current !== index);
    this.groupChange.emit({ ...this.group, children });
  }
}
