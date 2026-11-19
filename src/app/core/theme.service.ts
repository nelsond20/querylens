import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'ql-theme';

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    return 'system';
  }
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>(readPreference());

  private readonly media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
  private readonly systemDark = signal(this.media?.matches ?? false);

  readonly isDark = computed(() => {
    const preference = this.preference();
    return preference === 'system' ? this.systemDark() : preference === 'dark';
  });

  constructor() {
    const onChange = (event: MediaQueryListEvent) => this.systemDark.set(event.matches);
    this.media?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', onChange));

    effect(() => {
      document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
    });

    effect(() => {
      const preference = this.preference();
      try {
        localStorage.setItem(STORAGE_KEY, preference);
      } catch {
        // Storage unavailable (private window): the choice lasts for this session only.
      }
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
  }

  toggle(): void {
    this.preference.set(this.isDark() ? 'light' : 'dark');
  }
}
