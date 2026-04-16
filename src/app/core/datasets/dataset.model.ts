import { FieldDefinition } from './field-definition.model';

export interface Dataset {
  id: string;
  name: string;
  description: string;
  fields: FieldDefinition[];
  rows: Record<string, unknown>[];
  source: 'built-in' | 'file' | 'api';
}
