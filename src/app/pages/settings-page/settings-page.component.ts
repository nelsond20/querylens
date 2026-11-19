import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppRailComponent } from '../../shared/layout/app-rail.component';
import { ThemePreference, ThemeService } from '../../core/theme.service';
import { HistoryStore } from '../../store/history.store';
import { QueryStore } from '../../store/query.store';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, AppRailComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly historyStore = inject(HistoryStore);
  protected readonly queryStore = inject(QueryStore);

  protected clearLocalWorkspace(): void {
    this.historyStore.clearAll();
    this.queryStore.clearCustomDatasets();
    this.queryStore.clearQuery();
  }

  protected setTheme(preference: ThemePreference): void {
    this.theme.setPreference(preference);
  }
}
