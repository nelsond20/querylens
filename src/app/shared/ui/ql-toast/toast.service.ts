import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  /** Extra text shown in a selectable field (e.g. a link to copy by hand). Stays until dismissed. */
  detail?: string;
}

const AUTO_HIDE_MS = 2500;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly currentToast = signal<Toast | null>(null);
  private nextId = 1;
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly current = this.currentToast.asReadonly();

  show(message: string, detail?: string): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const toast: Toast = { id: this.nextId++, message, detail };
    this.currentToast.set(toast);
    if (!detail) {
      this.timer = setTimeout(() => this.dismiss(toast.id), AUTO_HIDE_MS);
    }
  }

  dismiss(id?: number): void {
    if (id === undefined || this.currentToast()?.id === id) {
      this.currentToast.set(null);
    }
  }
}
