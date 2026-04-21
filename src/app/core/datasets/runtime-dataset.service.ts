import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Dataset } from './dataset.model';
import {
  MAX_JSON_FILE_SIZE_BYTES,
  createRuntimeDataset,
  extractRowsFromPayload,
  parseJsonRows,
} from './runtime-dataset.utils';

@Injectable({ providedIn: 'root' })
export class RuntimeDatasetService {
  constructor(private readonly http: HttpClient) {}

  async createFromFile(file: File): Promise<Dataset> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'Imported Dataset';

    if (extension !== 'json') {
      throw new Error('Only .json files are supported');
    }

    if (file.size > MAX_JSON_FILE_SIZE_BYTES) {
      throw new Error(`JSON file exceeds ${(MAX_JSON_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)} MB limit`);
    }

    const rawText = await file.text();
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
    const rows = extractRowsFromPayload(payload);

    return createRuntimeDataset({
      id: this.makeId('api'),
      name: config.name?.trim() || `API ${new URL(config.url).hostname}`,
      description: `Fetched from API endpoint: ${config.url}`,
      source: 'api',
      rows,
    });
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
}
