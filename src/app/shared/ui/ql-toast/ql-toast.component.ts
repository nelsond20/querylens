import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { QlIconComponent } from '../ql-icon/ql-icon.component';
import { ToastService } from './toast.service';

@Component({
  selector: 'ql-toast',
  standalone: true,
  imports: [QlIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="region" role="status" aria-live="polite">
      @if (toasts.current(); as toast) {
        <div class="toast" [class.wide]="!!toast.detail">
          <span class="message">{{ toast.message }}</span>
          @if (toast.detail) {
            <input
              class="detail"
              readonly
              [value]="toast.detail"
              aria-label="Link to copy"
              (focus)="$any($event.target).select()"
            />
          }
          <button type="button" class="close" (click)="toasts.dismiss(toast.id)" aria-label="Dismiss">
            <ql-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .region {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      z-index: 1100;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 8px 8px 16px;
      border-radius: var(--r-btn);
      background: var(--ink);
      color: #fff;
      font-size: var(--text-13);
      font-weight: var(--weight-medium);
      box-shadow: var(--shadow-float);
      pointer-events: auto;
      animation: toast-in 220ms var(--ease-expo) both;
    }
    :host-context([data-theme='dark']) .toast { background: var(--surface-hi); color: var(--text); border: 1px solid var(--border); }
    .toast.wide { flex-wrap: wrap; max-width: min(560px, calc(100vw - 32px)); }
    .detail {
      flex: 1 1 260px;
      height: 30px;
      font-size: var(--text-12);
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: inherit;
    }
    .close {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border-radius: var(--r-sm);
      color: inherit;
      opacity: 0.7;
    }
    .close:hover { opacity: 1; background: rgba(255, 255, 255, 0.12); }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  `,
})
export class QlToastComponent {
  protected readonly toasts = inject(ToastService);
}
