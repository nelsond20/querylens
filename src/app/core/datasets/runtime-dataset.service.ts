import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { timeout } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Dataset } from './dataset.model';
import {
  MAX_JSON_FILE_SIZE_BYTES,
  MAX_JSON_TRAVERSAL_DEPTH,
  MAX_JSON_TRAVERSAL_NODES,
  MAX_JSON_ROWS,
  createRuntimeDataset,
  extractRowsFromPayload,
  parseJsonRows
} from './runtime-dataset.utils';

const API_TIMEOUT_MS = 15000;
const MAX_API_RESPONSE_BYTES = 8 * 1024 * 1024;

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
    const endpoint = this.parseAndValidateUrl(config.url);
    const headers = this.buildHeaders(config.bearerToken, config.headersJson);
    const rawText = await firstValueFrom(
      this.http.get(endpoint.toString(), { headers, responseType: 'text' }).pipe(timeout(API_TIMEOUT_MS)),
    );
    this.assertApiPayloadSize(rawText);

    let payload: unknown;
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      throw new Error('API response must be valid JSON');
    }

    const rows = extractRowsFromPayload(payload, {
      maxRows: MAX_JSON_ROWS,
      maxTraversalNodes: MAX_JSON_TRAVERSAL_NODES,
      maxTraversalDepth: MAX_JSON_TRAVERSAL_DEPTH,
    });

    return createRuntimeDataset({
      id: this.makeId('api'),
      name: config.name?.trim() || `API ${endpoint.hostname}`,
      description: `Fetched from API endpoint: ${endpoint.toString()}`,
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

  private parseAndValidateUrl(rawUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error('API URL is invalid');
    }

    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    const isHttps = parsed.protocol === 'https:';
    const isLocalHttp = isLocalhost && parsed.protocol === 'http:';

    if (!isHttps && !isLocalHttp) {
      throw new Error('Only https endpoints are allowed (http is allowed for localhost)');
    }

    return parsed;
  }

  private assertApiPayloadSize(rawText: string): void {
    const bytes = new TextEncoder().encode(rawText).length;
    if (bytes > MAX_API_RESPONSE_BYTES) {
      throw new Error(`API response exceeds ${(MAX_API_RESPONSE_BYTES / 1024 / 1024).toFixed(0)} MB limit`);
    }
  }
}
