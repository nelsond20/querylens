import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';

@Component({
  selector: 'app-capabilities-bento',
  standalone: true,
  imports: [QlIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './capabilities-bento.component.html',
  styleUrl: './capabilities-bento.component.css',
})
export class CapabilitiesBentoComponent {
  protected readonly json = `{
  "op": "AND",
  "children": [
    { "field": "type", "operator": "eq",
      "value": "purchase" },
    { "field": "value", "operator": "gt",
      "value": 100 }
  ]
}`;

  protected readonly bars = [
    { label: 'purchase', pct: 100, value: '18,240' },
    { label: 'signup', pct: 64, value: '11,673' },
    { label: 'click', pct: 41, value: '7,480' },
  ];
}
