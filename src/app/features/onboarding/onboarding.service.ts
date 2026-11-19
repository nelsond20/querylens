import { Injectable, inject, signal } from '@angular/core';
import { WorkspaceUiService } from '../../pages/workspace-page/workspace-ui.service';

const STORAGE_KEY = 'ql-orientation-dismissed';
export const TOUR_LENGTH = 4;

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly ui = inject(WorkspaceUiService);

  readonly stripDismissed = signal(readDismissed());
  readonly tourStep = signal<number | null>(null);

  constructor() {
    // First visit: show the rail with labels until the visitor dismisses the strip or uses the rail.
    if (!this.stripDismissed()) {
      this.ui.railExpanded.set(true);
    }
  }

  dismissStrip(): void {
    this.stripDismissed.set(true);
    this.ui.railExpanded.set(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Storage unavailable: the strip comes back next visit, which is harmless.
    }
  }

  startTour(): void {
    this.ui.railExpanded.set(false);
    this.ui.mainTab.set('results');
    this.ui.open('query');
    this.tourStep.set(0);
  }

  next(): void {
    const step = this.tourStep();
    if (step === null) {
      return;
    }
    if (step >= TOUR_LENGTH - 1) {
      this.end();
      return;
    }
    this.tourStep.set(step + 1);
  }

  end(): void {
    this.tourStep.set(null);
  }
}
