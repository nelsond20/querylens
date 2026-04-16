import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Dataset } from './dataset.model';
import { createRuntimeDataset, parseCsvRows, parseJsonRows } from './runtime-dataset.utils';

@Injectable({ providedIn: 'root' })
export class RuntimeDatasetService {
  constructor(private readonly http: HttpClient) {}

  async createFromFile(file: File): Promise<Dataset> {
    const rawText = await file.text();
    const extension = file.name.split('.').pop()?.toLowerCase();
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'Imported Dataset';

    if (extension === 'csv') {
      const rows = parseCsvRows(rawText);
      return createRuntimeDataset({
        id: this.makeId('file'),
        name: baseName,
        description: `Imported from CSV file: ${file.name}`,
        source: 'file',
        rows,
      });
    }

    const rows = parseJsonRows(rawText);
    return createRuntimeDataset({
      id: this.makeId('file'),
      name: baseName,
      description: `Imported from JSON file: ${file.name}`,
      source: 'file',
      rows,
    });
  }

  async createFromApi(config: {
    url: string;
    name?: string;
    bearerToken?: string;
    headersJson?: string;
  }): Promise<Dataset> {
    const headers = this.buildHeaders(config.bearerToken, config.headersJson);
    const payload = await firstValueFrom(this.http.get<unknown>(config.url, { headers }));

    const rows = this.extractRows(payload);

    return createRuntimeDataset({
      id: this.makeId('api'),
      name: config.name?.trim() || `API ${new URL(config.url).hostname}`,
      description: `Fetched from API endpoint: ${config.url}`,
      source: 'api',
      rows,
    });
  }

  private extractRows(payload: unknown): Record<string, unknown>[] {
    if (Array.isArray(payload) && payload.every((item) => this.isRecord(item))) {
      return payload as Record<string, unknown>[];
    }

    if (this.isRecord(payload)) {
      const directRows = payload['rows'];
      if (Array.isArray(directRows) && directRows.every((item) => this.isRecord(item))) {
        return directRows as Record<string, unknown>[];
      }

      const dataRows = payload['data'];
      if (Array.isArray(dataRows) && dataRows.every((item) => this.isRecord(item))) {
        return dataRows as Record<string, unknown>[];
      }
    }

    throw new Error('API response must be an object array, or an object containing rows/data array');
  }

  private buildHeaders(token?: string, headersJson?: string): HttpHeaders {
    let headers = new HttpHeaders();

    if (token?.trim()) {
      headers = headers.set('Authorization', `Bearer ${token.trim()}`);
    }

    if (headersJson?.trim()) {
      const parsed = JSON.parse(headersJson) as Record<string, unknown>;
      for (const [key, value] of Object.entries(parsed)) {
        headers = headers.set(key, String(value));
      }
    }

    return headers;
  }

  private makeId(source: 'file' | 'api'): string {
    return `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
