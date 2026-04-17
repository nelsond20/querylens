import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppMode, AppModeService } from './core/app-mode.service';
import { PrivacyConsentService } from './core/privacy-consent.service';
import { ThemeService } from './core/theme.service';

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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly appMode = inject(AppModeService);
  protected readonly privacyConsent = inject(PrivacyConsentService);
  protected readonly theme = inject(ThemeService);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.appMode.setModeFromQuery(params.get('mode'));
    });
  }

  protected setExperience(mode: AppMode): void {
    this.appMode.setMode(mode);
    this.router.navigate(['/workspace'], {
      queryParams: { mode },
      queryParamsHandling: 'merge',
    });
  }

  protected acceptPrivacyConsent(): void {
    this.privacyConsent.acceptConsent();
  }
}
