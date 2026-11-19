import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CountUpDirective } from '../../shared/ui/count-up.directive';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  imports: [CountUpDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-stage]': 'stage()' },
  template: `
    <span class="label">{{ label() }}</span>
    <span class="value">
      <span class="num" [qlCountUp]="value()"></span>
      @if (suffix() && value() !== null) {
        <span class="suffix">{{ suffix() }}</span>
      }
    </span>
    @if (sub()) {
      <span class="sub">{{ sub() }}</span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 12px 14px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-tile);
      box-shadow: var(--shadow-tile);
      min-width: 0;
    }
    :host([data-stage='filter']) {
      box-shadow: var(--shadow-tile), inset 0 3px 0 var(--stage-filter);
    }
    .label {
      font-size: var(--text-12);
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .value {
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: var(--text-28);
      letter-spacing: -0.02em;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
    }
    .suffix {
      font-size: var(--text-14);
      color: var(--text-muted);
      font-weight: 500;
    }
    .sub {
      font-size: var(--text-11);
      color: var(--text-muted);
    }
  `,
})
export class MetricTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number | null>();
  readonly suffix = input<string>('');
  readonly stage = input<'filter' | null>(null);
  readonly sub = input<string>('');
}
