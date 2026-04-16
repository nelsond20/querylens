import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppModeService } from './core/app-mode.service';
import { PrivacyConsentService } from './core/privacy-consent.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly appMode = inject(AppModeService);
  protected readonly privacyConsent = inject(PrivacyConsentService);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.appMode.setModeFromQuery(params.get('mode'));
    });
  }

  protected playDemo(): void {
    this.appMode.setMode('demo');
    this.router.navigate(['/workspace'], {
      queryParams: { mode: 'demo' },
      queryParamsHandling: 'merge',
    });
  }

  protected switchToLive(): void {
    this.appMode.setMode('live');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'live' },
      queryParamsHandling: 'merge',
    });
  }

  protected acceptPrivacyConsent(): void {
    this.privacyConsent.acceptConsent();
  }
}
