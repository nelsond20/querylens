import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { eventsDataset } from '../../core/datasets/events.dataset';
import { formatDateValue } from '../../core/insights/format';
import { FilterCondition } from '../../core/query-engine/filter-node.model';
import { execute } from '../../core/query-engine/query-engine';
import { serialize } from '../../core/serialization/query-serializer';
import { CountUpDirective } from '../../shared/ui/count-up.directive';

interface DemoChip {
  id: string;
  label: string;
  condition: FilterCondition;
}

const CHIPS: DemoChip[] = [
  { id: 'type', label: 'type = purchase', condition: { type: 'condition', field: 'type', operator: 'eq', value: 'purchase' } },
  { id: 'value', label: 'value > 100', condition: { type: 'condition', field: 'value', operator: 'gt', value: 100 } },
  {
    id: 'time',
    label: 'timestamp ≥ 1 Jul 2024',
    condition: { type: 'condition', field: 'timestamp', operator: 'gte', value: '2024-07-01' },
  },
];

const SEQUENCE_MS = [900, 1700, 2500];

@Component({
  selector: 'app-hero-demo',
  standalone: true,
  imports: [CountUpDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-demo.component.html',
  styleUrl: './hero-demo.component.css',
})
export class HeroDemoComponent {
  private readonly router = inject(Router);

  protected readonly chips = CHIPS;
  protected readonly on = signal<Record<string, boolean>>({});
  protected readonly hovered = signal<number | null>(null);
  protected readonly dots = eventsDataset.rows.map((row, index) => ({ index, id: String(row['eventId']) }));
  protected readonly scanned = eventsDataset.rows.length;

  private readonly run = computed(() => {
    const active = CHIPS.filter((chip) => this.on()[chip.id]).map((chip) => chip.condition);
    const start = performance.now();
    const rows = execute(eventsDataset.rows, { type: 'group', op: 'AND', children: active });
    return { rows, ms: Math.max(0.1, Math.round((performance.now() - start) * 10) / 10), active };
  });

  protected readonly hits = computed(() => new Set(this.run().rows.map((row) => String(row['eventId']))));
  protected readonly returned = computed(() => this.run().rows.length);
  protected readonly ms = computed(() => this.run().ms);

  protected readonly probe = computed(() => {
    const index = this.hovered();
    if (index === null) {
      return null;
    }
    const row = eventsDataset.rows[index];
    return {
      id: String(row['eventId']),
      type: String(row['type']),
      value: Number(row['value']).toLocaleString('en-US'),
      when: formatDateValue(row['timestamp']).split(',')[0],
      hit: this.hits().has(String(row['eventId'])),
    };
  });

  constructor() {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      this.on.set(Object.fromEntries(CHIPS.map((c) => [c.id, true])));
      return;
    }
    const timers = CHIPS.map((chip, i) =>
      setTimeout(() => this.on.update((state) => ({ ...state, [chip.id]: true })), SEQUENCE_MS[i]),
    );
    inject(DestroyRef).onDestroy(() => timers.forEach(clearTimeout));
  }

  protected toggle(id: string): void {
    this.on.update((state) => ({ ...state, [id]: !state[id] }));
  }

  protected probeDot(event: Event): void {
    const raw = (event.target as HTMLElement).dataset['i'];
    this.hovered.set(raw === undefined ? null : Number(raw));
  }

  protected openInWorkspace(): void {
    const q = serialize({
      datasetId: eventsDataset.id,
      filterTree: { type: 'group', op: 'AND', children: this.run().active },
      transformation: null,
    });
    this.router.navigate(['/workspace'], { queryParams: { q } });
  }
}
