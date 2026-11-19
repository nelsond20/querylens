import { describe, expect, it } from 'vitest';
import { formatDateValue } from './format';

describe('formatDateValue', () => {
  it('formats a date-only string without shifting the day', () => {
    expect(formatDateValue('2023-01-01')).toBe('1 Jan 2023');
    expect(formatDateValue('2023-12-31')).toBe('31 Dec 2023');
  });

  it('formats a timestamp with day, month, year and time', () => {
    expect(formatDateValue('2024-11-12T14:02:00.000Z', 'UTC')).toBe('12 Nov 2024, 14:02');
  });

  it('returns the raw text for values that are not dates', () => {
    expect(formatDateValue('soon')).toBe('soon');
    expect(formatDateValue(null)).toBe('');
    expect(formatDateValue(undefined)).toBe('');
  });
});
