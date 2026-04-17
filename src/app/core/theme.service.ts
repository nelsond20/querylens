import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(localStorage.getItem('ql-theme') === 'dark');

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      localStorage.setItem('ql-theme', dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }
}
