import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ThemePreference, ThemeService } from '../../core/theme.service';
import { AppRailComponent } from '../../shared/layout/app-rail.component';
import { QlSegmentedComponent, SegmentedOption } from '../../shared/ui/ql-segmented/ql-segmented.component';
import { ToastService } from '../../shared/ui/ql-toast/toast.service';
import { HistoryStore } from '../../store/history.store';
import { QueryStore } from '../../store/query.store';

const CONFIRM_WINDOW_MS = 4000;

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [AppRailComponent, QlSegmentedComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  protected readonly theme = inject(ThemeService);
  private readonly historyStore = inject(HistoryStore);
  private readonly queryStore = inject(QueryStore);
  private readonly toast = inject(ToastService);

  protected readonly themeOptions: SegmentedOption[] = [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'monitor' },
  ];

  protected readonly confirming = signal(false);
  private confirmTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.confirmTimer && clearTimeout(this.confirmTimer));
  }

  protected setTheme(preference: string): void {
    this.theme.setPreference(preference as ThemePreference);
  }

  protected clearLocalWorkspace(): void {
    if (!this.confirming()) {
      this.confirming.set(true);
      this.confirmTimer = setTimeout(() => this.confirming.set(false), CONFIRM_WINDOW_MS);
      return;
    }
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
    }
    this.confirming.set(false);
    this.historyStore.clearAll();
    this.queryStore.clearCustomDatasets();
    this.queryStore.clearQuery();
    this.toast.show('Local workspace cleared');
  }
}
