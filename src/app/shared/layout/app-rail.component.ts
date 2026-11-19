import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { ThemeService } from '../../core/theme.service';
import { RailItem, WorkspaceUiService } from '../../pages/workspace-page/workspace-ui.service';
import { IconName, QlIconComponent } from '../ui/ql-icon/ql-icon.component';
import { QlLogoComponent } from '../ui/ql-logo.component';

interface RailEntry {
  id: RailItem;
  label: string;
  hint: string;
  icon: IconName;
  stage: 'filter' | 'transform' | 'compare' | null;
}

export const RAIL_ENTRIES: RailEntry[] = [
  { id: 'query', label: 'Query', hint: 'Filters and scenarios', icon: 'filter', stage: 'filter' },
  { id: 'transform', label: 'Transform', hint: 'Sort, reshape or group', icon: 'transform', stage: 'transform' },
  { id: 'history', label: 'History', hint: 'Saved snapshots', icon: 'history', stage: null },
  { id: 'compare', label: 'Compare', hint: 'Diff against a snapshot', icon: 'compare', stage: 'compare' },
  { id: 'sources', label: 'Your data', hint: 'Import files or APIs', icon: 'database', stage: null },
];

@Component({
  selector: 'ql-app-rail',
  standalone: true,
  imports: [RouterLink, QlIconComponent, QlLogoComponent],
  templateUrl: './app-rail.component.html',
  styleUrl: './app-rail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.expanded]': 'ui.railExpanded()',
    'data-tour': 'rail',
  },
})
export class AppRailComponent {
  protected readonly ui = inject(WorkspaceUiService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly entries = RAIL_ENTRIES;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected onWorkspace(): boolean {
    return this.url().startsWith('/workspace');
  }

  protected onSettings(): boolean {
    return this.url().startsWith('/settings');
  }

  protected isActive(id: RailItem): boolean {
    return this.onWorkspace() && this.ui.panelOpen() && this.ui.activePanel() === id;
  }

  protected pick(id: RailItem): void {
    this.ui.railExpanded.set(false);
    if (!this.onWorkspace()) {
      this.ui.open(id);
      this.router.navigate(['/workspace']);
      return;
    }
    this.ui.select(id);
  }
}
