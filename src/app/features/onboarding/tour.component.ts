import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { OnboardingService, TOUR_LENGTH } from './onboarding.service';

interface TourStep {
  anchor: string;
  title: string;
  body: string;
  stage: 'filter' | null;
  side: 'right' | 'below' | 'below-end';
}

const STEPS: TourStep[] = [
  {
    anchor: 'query',
    title: 'Start from a scenario, or build filters',
    body: 'Filters are a visual AND/OR tree, synced with JSON. Pick a scenario to load a ready-made one.',
    stage: 'filter',
    side: 'right',
  },
  {
    anchor: 'bento',
    title: 'See the shape of the result',
    body: 'Metrics and charts update on every run. Hover the timeline, or use the arrow keys, to read each period.',
    stage: 'filter',
    side: 'below',
  },
  {
    anchor: 'rail',
    title: 'Everything else is one click away',
    body: 'Transform, save snapshots, compare runs, bring your own data.',
    stage: null,
    side: 'right',
  },
  {
    anchor: 'share',
    title: 'Share exactly what you see',
    body: 'Every query is a shareable URL. Copy the link and anyone can open the same view.',
    stage: null,
    side: 'below-end',
  },
];

const CALLOUT_WIDTH = 320;
const GAP = 12;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-tour',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onboarding.end()', '(window:resize)': 'measure()' },
  template: `
    @if (step(); as s) {
      @if (ring(); as r) {
        <div
          class="ring"
          [class.filter]="s.stage === 'filter'"
          [style.top.px]="r.top - 4"
          [style.left.px]="r.left - 4"
          [style.width.px]="r.width + 8"
          [style.height.px]="r.height + 8"
        ></div>
      }
      <div
        class="callout"
        role="dialog"
        aria-modal="false"
        [attr.aria-labelledby]="'tour-title-' + index()"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        [style.top.px]="position().top"
        [style.left.px]="position().left"
      >
        <p class="count">{{ index() + 1 }} of {{ total }}</p>
        <h2 [id]="'tour-title-' + index()">{{ s.title }}</h2>
        <p class="body">{{ s.body }}</p>
        <div class="actions">
          <button type="button" class="btn btn--quiet btn--sm" (click)="onboarding.end()">Skip</button>
          <button type="button" class="btn btn--primary btn--sm" cdkFocusInitial (click)="onboarding.next()">
            {{ index() === total - 1 ? 'Done' : 'Next' }}
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .ring {
      position: fixed;
      z-index: 900;
      border-radius: 14px;
      box-shadow: 0 0 0 2px var(--text), 0 0 0 9999px rgba(15, 17, 23, 0.28);
      pointer-events: none;
      transition: all 260ms var(--ease-expo);
    }
    .ring.filter { box-shadow: 0 0 0 2px var(--stage-filter), 0 0 0 9999px rgba(15, 17, 23, 0.28); }
    .callout {
      position: fixed;
      z-index: 901;
      width: 320px;
      max-width: calc(100vw - 24px);
      padding: 16px;
      border-radius: var(--r-tile);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-float);
      transition: top 260ms var(--ease-expo), left 260ms var(--ease-expo);
    }
    .count { font-size: var(--text-11); color: var(--text-muted); margin-bottom: 4px; }
    h2 { font-size: var(--text-16); margin-bottom: 6px; }
    .body { font-size: var(--text-13); color: var(--text-soft); line-height: 1.5; }
    .actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 14px; }
  `,
})
export class TourComponent {
  protected readonly onboarding = inject(OnboardingService);
  protected readonly total = TOUR_LENGTH;

  protected readonly index = computed(() => this.onboarding.tourStep() ?? 0);
  protected readonly step = computed(() => {
    const i = this.onboarding.tourStep();
    return i === null ? null : STEPS[i];
  });

  protected readonly ring = signal<Box | null>(null);
  protected readonly position = computed(() => {
    const r = this.ring();
    const s = this.step();
    if (!r || !s) {
      return { top: 80, left: 80 };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top: number;
    let left: number;
    if (s.side === 'right') {
      left = r.left + r.width + GAP;
      top = r.top + 16;
    } else if (s.side === 'below-end') {
      left = r.left + r.width - CALLOUT_WIDTH;
      top = r.top + r.height + GAP;
    } else {
      left = r.left + 16;
      top = r.top + r.height + GAP;
    }
    left = Math.max(12, Math.min(left, vw - CALLOUT_WIDTH - 12));
    top = Math.max(12, Math.min(top, vh - 200));
    return { top, left };
  });

  constructor() {
    // Measure after each render so the ring follows panels that open as the tour advances.
    afterRenderEffect(() => {
      this.onboarding.tourStep();
      this.measure();
    });
    const timer = setInterval(() => this.onboarding.tourStep() !== null && this.measure(), 400);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected measure(): void {
    const s = this.step();
    const el = s ? document.querySelector<HTMLElement>(`[data-tour="${s.anchor}"]`) : null;
    if (!el) {
      this.ring.set(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const box = { top: rect.top, left: rect.left, width: rect.width, height: Math.min(rect.height, window.innerHeight - rect.top - 8) };
    const prev = this.ring();
    if (!prev || prev.top !== box.top || prev.left !== box.left || prev.width !== box.width || prev.height !== box.height) {
      this.ring.set(box);
    }
  }
}
