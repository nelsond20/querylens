import { FilterGroup } from '../query-engine/filter-node.model';
import { Transformation } from '../query-engine/transformation.model';

export interface SerializedQuery {
  datasetId: string;
  filterTree: FilterGroup;
  transformation: Transformation | null;
}

function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(input: string): string {
  const binary = atob(input);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function serialize(query: SerializedQuery): string {
  return toBase64(JSON.stringify(query));
}

export function deserialize(encoded: string): SerializedQuery | null {
  if (!encoded) {
    return null;
  }

  try {
    return JSON.parse(fromBase64(encoded)) as SerializedQuery;
  } catch {
    return null;
  }
}
