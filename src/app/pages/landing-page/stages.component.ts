import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';

@Component({
  selector: 'app-stages',
  standalone: true,
  imports: [QlIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stages.component.html',
  styleUrl: './stages.component.css',
})
export class StagesComponent {
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
