import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconName, QlIconComponent } from '../ql-icon/ql-icon.component';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: IconName;
}

@Component({
  selector: 'ql-segmented',
  standalone: true,
  imports: [QlIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          role="radio"
          class="seg-btn"
          [class.on]="option.value === value()"
          [attr.aria-checked]="option.value === value()"
          (click)="valueChange.emit(option.value)"
        >
          @if (option.icon) {
            <ql-icon [name]="option.icon" [size]="14" />
          }
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: inline-flex; }
    .seg {
      display: inline-flex;
      gap: 2px;
      padding: 3px;
      border-radius: var(--r-btn);
      background: var(--bg);
      border: 1px solid var(--border);
    }
    .seg-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 26px;
      padding: 0 12px;
      border-radius: 7px;
      font-size: var(--text-12);
      font-weight: var(--weight-medium);
      color: var(--text-muted);
      transition: background-color var(--dur-fast), color var(--dur-fast);
    }
    .seg-btn:hover { color: var(--text); }
    .seg-btn.on {
      background: var(--surface);
      color: var(--text);
      box-shadow: 0 1px 2px rgba(20, 22, 31, 0.08);
    }
  `,
})
export class QlSegmentedComponent {
  readonly options = input.required<SegmentedOption[]>();
  readonly value = input.required<string>();
  readonly label = input('');
  readonly valueChange = output<string>();
}
