import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';
import { HistoryEntry } from '../../store/history-entry.model';
import { HistoryStore } from '../../store/history.store';
import { QueryStore } from '../../store/query.store';
import { ToastService } from '../../shared/ui/ql-toast/toast.service';

@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [CommonModule, QlIconComponent],
  templateUrl: './history-panel.component.html',
  styleUrl: './history-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPanelComponent {
  protected readonly historyStore = inject(HistoryStore);
  protected readonly queryStore = inject(QueryStore);
  protected readonly saveName = signal('');
  private readonly toast = inject(ToastService);

  protected save(): void {
    const name = this.saveName().trim();
    if (!name) {
      return;
    }

    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      datasetId: this.queryStore.selectedDatasetId(),
      filterTree: this.queryStore.filterTree(),
      transformation: this.queryStore.transformation(),
    };

    this.historyStore.saveEntry(entry);
    this.saveName.set('');
    this.toast.show('Snapshot saved');
  }

  protected load(id: string): void {
    this.historyStore.loadEntry(id);
  }

  protected delete(id: string): void {
    this.historyStore.deleteEntry(id);
  }

  protected datasetName(id: string): string {
    return this.queryStore.findDataset(id)?.name ?? id;
  }

  protected onNameInput(event: Event): void {
    this.saveName.set((event.target as HTMLInputElement).value);
  }
}
