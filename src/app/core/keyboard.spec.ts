import { describe, expect, it } from 'vitest';
import { isTypingTarget } from './keyboard';

describe('isTypingTarget', () => {
  it('treats form fields and contenteditable as typing targets', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
  });

  it('ignores buttons, plain elements and null', () => {
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isTypingTarget({ tagName: 'DIV' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
