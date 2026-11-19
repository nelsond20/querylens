import { describe, expect, it } from 'vitest';
import { matchesCommand } from './command-match';

describe('matchesCommand', () => {
  it('matches everything for an empty query', () => {
    expect(matchesCommand('', 'Run query')).toBe(true);
    expect(matchesCommand('   ', 'Run query')).toBe(true);
  });

  it('matches a case-insensitive substring', () => {
    expect(matchesCommand('low', 'Run scenario: Low stock watchlist')).toBe(true);
    expect(matchesCommand('QUERY', 'Run query')).toBe(true);
  });

  it('matches word initials', () => {
    expect(matchesCommand('rq', 'Run query')).toBe(true);
    expect(matchesCommand('csl', 'Copy share link')).toBe(true);
  });

  it('rejects unrelated text', () => {
    expect(matchesCommand('zzz', 'Run query')).toBe(false);
    expect(matchesCommand('qr', 'Run query')).toBe(false);
  });
});
