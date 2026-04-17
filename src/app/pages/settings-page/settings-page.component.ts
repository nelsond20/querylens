import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppMode, AppModeService } from '../../core/app-mode.service';
import { HistoryStore } from '../../store/history.store';
import { QueryStore } from '../../store/query.store';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly appMode = inject(AppModeService);
  protected readonly historyStore = inject(HistoryStore);
  protected readonly queryStore = inject(QueryStore);

  protected setMode(mode: AppMode): void {
    if (this.appMode.mode() !== mode) {
      this.queryStore.resetForMode(mode);
    }

    this.appMode.setMode(mode);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode },
      queryParamsHandling: 'merge',
    });
  }

  protected clearLocalWorkspace(): void {
    this.historyStore.clearAll();
    this.queryStore.clearCustomDatasets();
    this.queryStore.clearQuery();
  }
}
