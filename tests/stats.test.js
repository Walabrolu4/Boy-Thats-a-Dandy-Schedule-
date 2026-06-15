import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStats } from '../src/lib/stats.js';

vi.mock('../src/lib/storage.js', () => ({
  getWeekKey: () => 'ls-week-2099-01-01', // "current" week, excluded from history
  getSchedule: () => [
    { key: 'mon', sessions: [
      { id: 's1', tagId: 'exer' },
      { id: 's2', tagId: 'draw' }
    ]}
  ],
  getTagsSync: () => []
}));

describe('getStats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('computes adherence and tag completions from `checked` CRDT entries', () => {
    localStorage.setItem('ls-week-2026-01-02', JSON.stringify({
      checked: {
        'mon-s1': { value: true, updatedAt: 1 },
        'mon-s2': { value: false, updatedAt: 1 }
      },
      tasks: {},
      review: {},
      scheduleSnapshot: [
        { key: 'mon', sessions: [
          { id: 's1', tagId: 'exer' },
          { id: 's2', tagId: 'draw' }
        ]}
      ]
    }));

    const [week] = getStats();
    expect(week.adherencePercent).toBe(50); // 1 of 2 scheduled sessions checked
    expect(week.tagCompletions).toEqual({ exer: 1 });
  });

  it('also handles legacy boolean `checked` entries', () => {
    localStorage.setItem('ls-week-2026-01-09', JSON.stringify({
      checked: { 'mon-s1': true },
      tasks: {},
      review: {},
      scheduleSnapshot: [
        { key: 'mon', sessions: [{ id: 's1', tagId: 'exer' }] }
      ]
    }));

    const [week] = getStats();
    expect(week.adherencePercent).toBe(100);
    expect(week.tagCompletions).toEqual({ exer: 1 });
  });
});
