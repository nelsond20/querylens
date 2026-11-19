import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dataset } from '../../core/datasets/dataset.model';
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
      this.useDataset(dataset, `Imported ${dataset.rows.length.toLocaleString('en-US')} rows from ${file.name}`);
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
      this.useDataset(dataset, `Fetched ${dataset.rows.length.toLocaleString('en-US')} rows from the API`);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'API request failed');
    } finally {
      this.loadingApi.set(false);
    }
  }

  /** Adds, selects and runs the dataset. If the browser can't store it (quota, private mode) it still works for this session. */
  private useDataset(dataset: Dataset, summary: string): void {
    let persisted = true;
    try {
      this.store.addCustomDataset(dataset);
    } catch {
      // The store updates its state before writing to localStorage, so the dataset is already listed.
      persisted = false;
    }
    this.store.setDataset(dataset.id);
    this.store.executeQuery();
    if (persisted) {
      this.successMessage.set(summary);
      this.toast.show('Dataset imported');
    } else {
      this.successMessage.set(`${summary}. It's too large to keep in this browser, so it's available until you reload.`);
      this.toast.show('Imported for this session only');
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
