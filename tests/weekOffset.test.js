import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getWeekKey, getWeekRange, getWeekLabel } from '../src/lib/storage.js';

describe('offset-aware week helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes this/last/next week keys and labels relative to a Monday', () => {
    // 2026-06-15 is a Monday; the week's Friday anchor is 2026-06-12.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));

    expect(getWeekKey(0)).toBe('ls-week-2026-06-12');
    expect(getWeekKey(-1)).toBe('ls-week-2026-06-05');
    expect(getWeekKey(1)).toBe('ls-week-2026-06-19');

    expect(getWeekLabel(0)).toBe('This Week');
    expect(getWeekLabel(-1)).toBe('Last Week');
    expect(getWeekLabel(1)).toBe('Next Week');

    expect(getWeekRange(0)).toBe('Jun 12 – Jun 18');

    // Two weeks back has no special label, just the date range.
    expect(getWeekLabel(-2)).toBe(getWeekRange(-2));
    expect(getWeekRange(-2)).toBe('May 29 – Jun 4');
  });

  it('handles a year boundary correctly', () => {
    // 2026-01-01 is a Thursday; its week's Friday anchor is 2025-12-26.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00'));

    expect(getWeekKey(0)).toBe('ls-week-2025-12-26');
    expect(getWeekKey(1)).toBe('ls-week-2026-01-02');
    expect(getWeekRange(0)).toBe('Dec 26 – Jan 1');
  });
});
