import { Injectable, signal } from '@angular/core';

export type RailItem = 'query' | 'transform' | 'history' | 'compare' | 'sources';

/** UI state of the workspace shell, shared by the rail, top bar, panels, palette and tour. */
@Injectable({ providedIn: 'root' })
export class WorkspaceUiService {
  readonly activePanel = signal<RailItem>('query');
  readonly panelOpen = signal(true);
  readonly mainTab = signal<'results' | 'diff'>('results');
  readonly compareSnapshotId = signal('');
  readonly railExpanded = signal(false);

  open(panel: RailItem): void {
    this.activePanel.set(panel);
    this.panelOpen.set(true);
  }

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  /** Rail click: opens the item, or collapses the panel when the item is already showing. */
  select(panel: RailItem): void {
    if (this.panelOpen() && this.activePanel() === panel) {
      this.panelOpen.set(false);
      return;
    }
    this.open(panel);
  }
}
