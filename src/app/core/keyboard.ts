const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** True when a key press on this element is text entry and single-key shortcuts must not fire. */
export function isTypingTarget(target: { tagName?: string; isContentEditable?: boolean } | null): boolean {
  if (!target) {
    return false;
  }
  return Boolean(target.isContentEditable) || TYPING_TAGS.has(target.tagName ?? '');
}
