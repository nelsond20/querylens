import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { Timeline } from '../../core/insights/bento-data';

const W = 600;
const H = 120;
const PAD_TOP = 10;
const PAD_BOTTOM = 4;

function pointsFor(values: number[]): string {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? W / (values.length - 1) : 0;
  return values
    .map((v, i) => `${(i * step).toFixed(1)},${(H - PAD_BOTTOM - (v / max) * (H - PAD_TOP - PAD_BOTTOM)).toFixed(1)}`)
    .join(' ');
}

@Component({
  selector: 'app-timeline-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-chart.component.html',
  styleUrl: './timeline-chart.component.css',
})
export class TimelineChartComponent {
  readonly timeline = input.required<Timeline>();

  protected readonly scrub = signal<number | null>(null);
  protected readonly viewBox = `0 0 ${W} ${H}`;

  protected readonly buckets = computed(() => this.timeline().buckets);
  protected readonly unitLabel = computed(() => this.timeline().unit);
  protected readonly matchedTotal = computed(() => this.buckets().reduce((sum, b) => sum + b.matched, 0));

  protected readonly matchedLine = computed(() => pointsFor(this.buckets().map((b) => b.matched)));
  protected readonly totalLine = computed(() => pointsFor(this.buckets().map((b) => b.total)));
  protected readonly matchedArea = computed(() => `0,${H} ${this.matchedLine()} ${W},${H}`);

  protected readonly active = computed(() => {
    const index = this.scrub();
    return index === null ? null : (this.buckets()[index] ?? null);
  });

  protected readonly guideLeft = computed(() => {
    const index = this.scrub();
    const n = this.buckets().length;
    return index === null || n < 2 ? null : (index / (n - 1)) * 100;
  });

  protected readonly summary = computed(() => {
    const buckets = this.buckets();
    if (buckets.length === 0) {
      return '';
    }
    const peak = buckets.reduce((best, b) => (b.matched > best.matched ? b : best), buckets[0]);
    return `Rows per ${this.unitLabel()}: ${this.matchedTotal()} matching rows across ${buckets.length} ${this.unitLabel()}s. Busiest: ${peak.label} with ${peak.matched}.`;
  });

  constructor() {
    // A new dataset or query resets the scrubber so it never points past the last bucket.
    effect(() => {
      this.timeline();
      this.scrub.set(null);
    });
  }

  protected onPointer(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const n = this.buckets().length;
    if (n === 0 || rect.width === 0) {
      return;
    }
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.scrub.set(Math.round(ratio * (n - 1)));
  }

  protected onKey(event: KeyboardEvent): void {
    const n = this.buckets().length;
    if (n === 0) {
      return;
    }
    const current = this.scrub();
    if (event.key === 'ArrowRight') {
      this.scrub.set(current === null ? 0 : Math.min(n - 1, current + 1));
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      this.scrub.set(current === null ? n - 1 : Math.max(0, current - 1));
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.scrub.set(null);
    }
  }
}
