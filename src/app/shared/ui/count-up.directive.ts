import { DestroyRef, Directive, ElementRef, effect, inject, input } from '@angular/core';

const DURATION_MS = 400;

function format(value: number, decimals: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Animates a number from its previous value to the new one; jumps straight there under reduced motion. */
@Directive({
  selector: '[qlCountUp]',
  standalone: true,
})
export class CountUpDirective {
  readonly qlCountUp = input.required<number | null>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private current = 0;
  private frame = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));

    effect(() => {
      const target = this.qlCountUp();
      cancelAnimationFrame(this.frame);

      if (target === null || !Number.isFinite(target)) {
        this.el.nativeElement.textContent = '—';
        this.current = 0;
        return;
      }

      const decimals = Number.isInteger(target) ? 0 : 1;
      const from = this.current;
      if (from === target || prefersReducedMotion()) {
        this.current = target;
        this.el.nativeElement.textContent = format(target, decimals);
        return;
      }

      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        this.current = from + (target - from) * eased;
        this.el.nativeElement.textContent = format(t === 1 ? target : this.current, decimals);
        if (t < 1) {
          this.frame = requestAnimationFrame(step);
        } else {
          this.current = target;
        }
      };
      this.frame = requestAnimationFrame(step);
    });
  }
}
