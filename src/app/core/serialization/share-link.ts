import { serialize, SerializedQuery } from './query-serializer';

/** Absolute workspace URL that reproduces the query when opened. */
export function buildShareUrl(origin: string, query: SerializedQuery): string {
  return `${origin}/workspace?q=${encodeURIComponent(serialize(query))}`;
}
