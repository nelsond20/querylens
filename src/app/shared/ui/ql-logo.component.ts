import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The lens mark: the three pipeline hues split by a lens. The only decorative use of the spectrum. */
@Component({
  selector: 'ql-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', style: 'display:inline-flex;flex:none;' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="ql-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#3461f0" />
          <stop offset="0.55" stop-color="#7c4dea" />
          <stop offset="1" stop-color="#e0502f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#ql-logo-g)" />
      <circle cx="14.5" cy="14.5" r="6.5" fill="none" stroke="#fff" stroke-width="2.6" />
      <path d="M19.4 19.4 24 24" stroke="#fff" stroke-width="2.6" stroke-linecap="round" />
    </svg>
  `,
})
export class QlLogoComponent {
  readonly size = input(24);
}
