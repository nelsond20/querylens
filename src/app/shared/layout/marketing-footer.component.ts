import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QlIconComponent } from '../ui/ql-icon/ql-icon.component';
import { GITHUB_URL } from './marketing-nav.component';

@Component({
  selector: 'ql-marketing-footer',
  standalone: true,
  imports: [RouterLink, QlIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <p class="privacy">
        <ql-icon name="lock" [size]="14" />
        Everything runs in your browser. Your data never leaves this device.
        <a routerLink="/privacy">Privacy details</a>
      </p>
      <p class="meta">
        <a [href]="githubUrl" target="_blank" rel="noopener">Source on GitHub</a>
        <span aria-hidden="true">/</span>
        <span>MIT license</span>
      </p>
    </footer>
  `,
  styles: `
    .footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px 24px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 40px;
      border-top: 1px solid var(--border);
      font-size: var(--text-13);
      color: var(--text-muted);
    }
    .privacy {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .meta {
      display: inline-flex;
      gap: 8px;
    }
    a { color: var(--text-soft); }
    a:hover { color: var(--text); }
    @media (max-width: 480px) {
      .footer { padding: 24px 16px 32px; }
    }
  `,
})
export class MarketingFooterComponent {
  protected readonly githubUrl = GITHUB_URL;
}
