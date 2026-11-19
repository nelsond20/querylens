import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Breakdown } from '../../core/insights/bento-data';
import { treemapLayout } from '../../core/insights/treemap-layout';

/** Tint strength per rank: strongest block first. */
const TINTS = [100, 52, 38, 28, 20, 14];

@Component({
  selector: 'app-breakdown-treemap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="head">
      <h3>
        By
        @if (breakdown().candidates.length > 1) {
          <select
            class="field-select"
            aria-label="Break results down by"
            [value]="breakdown().field"
            (change)="fieldChange.emit($any($event.target).value)"
          >
            @for (candidate of breakdown().candidates; track candidate) {
              <option [value]="candidate" [selected]="candidate === breakdown().field">{{ label(candidate) }}</option>
            }
          </select>
        } @else {
          <span class="field">{{ label(breakdown().field) }}</span>
        }
      </h3>
    </div>
    <div class="map" #map role="list" [attr.aria-label]="'Results by ' + label(breakdown().field)">
      @for (block of blocks(); track block.label) {
        <div
          class="block"
          role="listitem"
          [class.strong]="block.strong"
          [class.tiny]="block.tiny"
          [style.left.%]="block.x"
          [style.top.%]="block.y"
          [style.width.%]="block.w"
          [style.height.%]="block.h"
          [style.--tint]="block.tint + '%'"
          [title]="block.label + ': ' + block.count + ' rows (' + block.pct + '%)'"
        >
          <span class="name">{{ block.label }}</span>
          <span class="pct num">{{ block.pct }}%</span>
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .head { min-height: 20px; display: flex; align-items: baseline; }
    h3 {
      display: inline-flex;
      align-items: baseline;
      gap: 4px;
      font-family: var(--font-ui);
      font-size: var(--text-12);
      font-weight: var(--weight-medium);
      color: var(--text-muted);
      letter-spacing: 0;
    }
    .field { color: var(--text); }
    .field-select {
      width: auto;
      height: 22px;
      padding: 0 4px;
      border: 0;
      border-bottom: 1px dashed var(--text-muted);
      border-radius: 0;
      background: transparent;
      font-size: var(--text-12);
      font-weight: var(--weight-medium);
      color: var(--text);
      cursor: pointer;
    }
    .field-select:focus { box-shadow: none; }
    .map {
      position: relative;
      height: 118px;
      border-radius: var(--r-input);
      overflow: hidden;
    }
    .block {
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6px 8px;
      border: 2px solid var(--surface);
      border-radius: 8px;
      background: color-mix(in srgb, var(--stage-filter) var(--tint), var(--surface));
      color: var(--text);
      overflow: hidden;
      transition: left 300ms var(--ease-expo), top 300ms var(--ease-expo), width 300ms var(--ease-expo),
        height 300ms var(--ease-expo), background-color 300ms;
    }
    .block.strong { color: var(--on-accent); }
    .name {
      font-size: var(--text-11);
      font-weight: var(--weight-semi);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pct { font-size: var(--text-12); font-weight: var(--weight-medium); }
    .block.tiny .name, .block.tiny .pct { display: none; }
  `,
})
export class BreakdownTreemapComponent implements AfterViewInit {
  readonly breakdown = input.required<Breakdown>();
  readonly labels = input<Record<string, string>>({});
  readonly fieldChange = output<string>();

  private readonly map = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly destroyRef = inject(DestroyRef);
  private readonly aspect = signal(2);

  protected readonly blocks = computed(() => {
    const slices = this.breakdown().slices;
    const rects = treemapLayout(
      slices.map((s) => s.count),
      this.aspect(),
    );
    return slices.map((slice, i) => {
      const r = rects[i];
      return {
        ...slice,
        x: r.x * 100,
        y: r.y * 100,
        w: r.w * 100,
        h: r.h * 100,
        tint: TINTS[Math.min(i, TINTS.length - 1)],
        strong: i === 0,
        tiny: r.w * this.aspect() < 0.18 || r.h < 0.22,
      };
    });
  });

  ngAfterViewInit(): void {
    const el = this.map().nativeElement;
    const measure = () => {
      if (el.clientHeight > 0) {
        this.aspect.set(el.clientWidth / el.clientHeight);
      }
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    }
  }

  protected label(field: string): string {
    return this.labels()[field] ?? field;
  }
}
