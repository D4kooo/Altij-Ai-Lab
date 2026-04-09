import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cn, formatDate, formatDateTime, formatRelativeTime, formatDuration } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('handles tailwind conflicts via twMerge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional objects', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });
});

describe('formatDate', () => {
  it('formats a Date object in french short format', () => {
    const result = formatDate(new Date('2026-01-15T00:00:00Z'));
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
  });

  it('accepts ISO string', () => {
    const result = formatDate('2026-01-15T00:00:00Z');
    expect(result).toMatch(/15/);
  });
});

describe('formatDateTime', () => {
  it('includes hours and minutes', () => {
    const result = formatDateTime('2026-01-15T14:30:00Z');
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-09T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "À l\'instant" for under a minute', () => {
    expect(formatRelativeTime(new Date('2026-04-09T11:59:30Z'))).toBe("À l'instant");
  });

  it('returns minutes for under an hour', () => {
    expect(formatRelativeTime(new Date('2026-04-09T11:45:00Z'))).toBe('Il y a 15 min');
  });

  it('returns hours for under a day', () => {
    expect(formatRelativeTime(new Date('2026-04-09T09:00:00Z'))).toBe('Il y a 3h');
  });

  it('returns days for under a week', () => {
    expect(formatRelativeTime(new Date('2026-04-06T12:00:00Z'))).toBe('Il y a 3j');
  });

  it('falls back to formatDate for older dates', () => {
    const result = formatRelativeTime(new Date('2026-01-01T12:00:00Z'));
    expect(result).toMatch(/2026/);
  });

  it('accepts ISO string input', () => {
    expect(formatRelativeTime('2026-04-09T11:45:00Z')).toBe('Il y a 15 min');
  });
});

describe('formatDuration', () => {
  it('returns seconds when under a minute', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('returns minutes when under an hour', () => {
    expect(formatDuration(60)).toBe('1 min');
    expect(formatDuration(125)).toBe('2 min');
  });

  it('returns hours without remainder when aligned', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(7200)).toBe('2h');
  });

  it('returns hours and minutes when mixed', () => {
    expect(formatDuration(3660)).toBe('1h 1min');
    expect(formatDuration(5400)).toBe('1h 30min');
  });
});
