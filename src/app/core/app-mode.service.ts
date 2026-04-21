import { Injectable, computed, signal } from '@angular/core';

export type AppMode = 'demo' | 'live';

@Injectable({ providedIn: 'root' })
export class AppModeService {
  private readonly modeSignal = signal<AppMode>('live');

  readonly mode = this.modeSignal.asReadonly();
  readonly isDemo = computed(() => this.modeSignal() === 'demo');

  setMode(mode: AppMode): void {
    this.modeSignal.set(mode);
  }

  setModeFromQuery(rawMode: string | null): void {
    this.modeSignal.set(rawMode === 'demo' ? 'demo' : 'live');
  }
}
