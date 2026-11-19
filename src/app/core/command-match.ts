/** Command palette filter: case-insensitive substring, or the initials of the label's words ("rq" → "Run query"). */
export function matchesCommand(query: string, label: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const text = label.toLowerCase();
  if (text.includes(q)) {
    return true;
  }
  const initials = text
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('');
  return initials.startsWith(q);
}
