import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/theme.service';
import { QlIconComponent } from '../ui/ql-icon/ql-icon.component';
import { QlLogoComponent } from '../ui/ql-logo.component';

export const GITHUB_URL = 'https://github.com/nelsond20/querylens';

@Component({
  selector: 'ql-marketing-nav',
  standalone: true,
  imports: [RouterLink, QlIconComponent, QlLogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="nav">
      <a class="brand" routerLink="/landing" aria-label="QueryLens home">
        <ql-logo [size]="26" />
        <span>QueryLens</span>
      </a>
      <nav class="links" aria-label="Main">
        <a class="link" routerLink="/workspace">Workspace</a>
        <a class="link" [href]="githubUrl" target="_blank" rel="noopener">
          <ql-icon name="github" />
          <span>GitHub</span>
        </a>
        <button
          class="btn btn--quiet btn--icon"
          type="button"
          (click)="theme.toggle()"
          [attr.aria-label]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
          [title]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
        >
          <ql-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
        </button>
      </nav>
    </header>
  `,
  styles: `
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      padding: 18px 24px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: var(--text-16);
      letter-spacing: -0.01em;
      color: var(--text);
      text-decoration: none;
    }
    .links {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      border-radius: var(--r-btn);
      font-size: var(--text-14);
      color: var(--text-soft);
      text-decoration: none;
    }
    .link:hover {
      color: var(--text);
      background: var(--surface);
    }
    @media (max-width: 480px) {
      .nav { padding: 14px 16px; }
      .link span { display: none; }
      .link:first-child span { display: inline; }
    }
  `,
})
export class MarketingNavComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly githubUrl = GITHUB_URL;
}
