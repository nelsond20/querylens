import { Injectable, inject } from '@angular/core';
import { buildShareUrl } from '../../core/serialization/share-link';
import { ToastService } from '../../shared/ui/ql-toast/toast.service';
import { QueryStore } from '../../store/query.store';

@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly store = inject(QueryStore);
  private readonly toast = inject(ToastService);

  currentUrl(): string {
    return buildShareUrl(location.origin, {
      datasetId: this.store.selectedDatasetId(),
      filterTree: this.store.filterTree(),
      transformation: this.store.transformation(),
    });
  }

  async copyLink(): Promise<void> {
    const url = this.currentUrl();
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(url);
      this.toast.show('Link copied');
    } catch {
      // Insecure origin or permission denied: hand the link over to copy manually.
      this.toast.show('Copy this link', url);
    }
  }
}
