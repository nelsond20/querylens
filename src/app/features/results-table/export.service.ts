import { Injectable, signal } from '@angular/core';

export interface ResultExporter {
  exportCsv(): void;
  exportJson(): void;
}

/** Lets the command palette export what the results table currently shows (search and sort applied). */
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly exporter = signal<ResultExporter | null>(null);

  readonly available = () => this.exporter() !== null;

  register(exporter: ResultExporter): () => void {
    this.exporter.set(exporter);
    return () => {
      if (this.exporter() === exporter) {
        this.exporter.set(null);
      }
    };
  }

  csv(): void {
    this.exporter()?.exportCsv();
  }

  json(): void {
    this.exporter()?.exportJson();
  }
}
