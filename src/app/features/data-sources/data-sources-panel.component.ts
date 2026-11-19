import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RuntimeDatasetService } from '../../core/datasets/runtime-dataset.service';
import { QueryStore } from '../../store/query.store';
import { ToastService } from '../../shared/ui/ql-toast/toast.service';

import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';

@Component({
  selector: 'app-data-sources-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, QlIconComponent],
  templateUrl: './data-sources-panel.component.html',
  styleUrl: './data-sources-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSourcesPanelComponent {
  protected readonly store = inject(QueryStore);
  private readonly runtimeDatasetService = inject(RuntimeDatasetService);
  private readonly toast = inject(ToastService);

  protected readonly apiUrl = signal('');
  protected readonly apiName = signal('');
  protected readonly apiBearerToken = signal('');
  protected readonly apiHeadersJson = signal('');

  protected readonly loadingFile = signal(false);
  protected readonly loadingApi = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.loadingFile.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const dataset = await this.runtimeDatasetService.createFromFile(file);
      this.store.addCustomDataset(dataset);
      this.store.setDataset(dataset.id);
      this.store.executeQuery();
      this.successMessage.set(`Imported ${dataset.rows.length} rows from ${file.name}`);
      this.toast.show('Dataset imported');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'File import failed');
    } finally {
      this.loadingFile.set(false);
      input.value = '';
    }
  }

  protected async fetchFromApi(): Promise<void> {
    if (!this.apiUrl().trim()) {
      this.errorMessage.set('API URL is required');
      return;
    }

    this.loadingApi.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const dataset = await this.runtimeDatasetService.createFromApi({
        url: this.apiUrl().trim(),
        name: this.apiName().trim(),
        bearerToken: this.apiBearerToken().trim(),
        headersJson: this.apiHeadersJson().trim(),
      });
      this.store.addCustomDataset(dataset);
      this.store.setDataset(dataset.id);
      this.store.executeQuery();
      this.successMessage.set(`Fetched ${dataset.rows.length} rows from API`);
      this.toast.show('Dataset imported');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'API request failed');
    } finally {
      this.loadingApi.set(false);
    }
  }

  protected removeCustomDataset(id: string): void {
    this.store.removeCustomDataset(id);
  }

  protected selectImportedDataset(id: string): void {
    this.store.setDataset(id);
    this.store.executeQuery();
  }
}
