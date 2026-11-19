import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ShellKind } from './app.routes';
import { ThemeService } from './core/theme.service';
import { MarketingFooterComponent } from './shared/layout/marketing-footer.component';
import { MarketingNavComponent } from './shared/layout/marketing-nav.component';
import { QlToastComponent } from './shared/ui/ql-toast/ql-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MarketingNavComponent, MarketingFooterComponent, QlToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly shell = signal<ShellKind>('marketing');

  constructor() {
    // Instantiated eagerly so the theme attribute is applied before first paint of any route.
    inject(ThemeService);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        let snapshot = this.route.snapshot;
        while (snapshot.firstChild) {
          snapshot = snapshot.firstChild;
        }
        this.shell.set((snapshot.data['shell'] as ShellKind | undefined) ?? 'marketing');
      });
  }
}
