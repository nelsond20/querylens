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
    :host {
      position: sticky;
      top: 12px;
      z-index: 20;
      display: flex;
      justify-content: center;
      padding: 12px 16px 0;
      pointer-events: none;
    }
    .nav {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 6px 6px 6px 14px;
      border: 1px solid var(--border);
      border-radius: var(--r-pill);
      background: color-mix(in srgb, var(--surface) 82%, transparent);
      backdrop-filter: blur(14px);
      box-shadow: var(--shadow-tile);
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
      gap: 2px;
    }
    .link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 14px;
      border-radius: var(--r-pill);
      font-size: var(--text-14);
      color: var(--text-soft);
      text-decoration: none;
    }
    .link:hover {
      color: var(--text);
      background: var(--surface-hi);
    }
    .links .btn {
      border-radius: var(--r-pill);
    }
    @media (max-width: 480px) {
      .nav { gap: 8px; padding-left: 10px; }
      .brand span { display: none; }
      .link { padding: 0 10px; }
      .link span { display: none; }
      .link:first-child span { display: inline; }
    }
  `,
})
export class MarketingNavComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly githubUrl = GITHUB_URL;
}
