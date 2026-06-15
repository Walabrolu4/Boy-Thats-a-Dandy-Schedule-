import { describe, it, expect, beforeEach } from 'vitest';
import { buildTagsFromHabits, buildScheduleFromHabits } from '../src/lib/onboarding.js';
import { isOnboarded, markOnboarded, shouldShowOnboarding } from '../src/lib/storage.js';

describe('buildTagsFromHabits', () => {
  it('sets mvwTarget/mvwOutOf to 7/7 for an "every day" habit', () => {
    const tags = buildTagsFromHabits([{ name: 'Stretch', frequency: 7, preferredTime: 'morning' }]);
    expect(tags).toHaveLength(1);
    expect(tags[0]).toMatchObject({ label: 'Stretch', mvwTarget: 7, mvwOutOf: 7 });
  });

  it('sets mvwTarget: N, mvwOutOf: 7 for N > 1', () => {
    const tags = buildTagsFromHabits([{ name: 'Exercise', frequency: 3, preferredTime: 'evening' }]);
    expect(tags[0]).toMatchObject({ mvwTarget: 3, mvwOutOf: 7 });
  });

  it('sets only mvwTarget: 1 (no mvwOutOf) for a 1x/week habit', () => {
    const tags = buildTagsFromHabits([{ name: 'Programming', frequency: 1, preferredTime: 'afternoon' }]);
    expect(tags[0].mvwTarget).toBe(1);
    expect(tags[0].mvwOutOf).toBeUndefined();
  });

  it('ignores habits with empty names', () => {
    const tags = buildTagsFromHabits([
      { name: '', frequency: 7, preferredTime: 'morning' },
      { name: 'Reading', frequency: 1, preferredTime: 'night' },
    ]);
    expect(tags).toHaveLength(1);
    expect(tags[0].label).toBe('Reading');
  });
});

describe('buildScheduleFromHabits', () => {
  it('returns 7 day shells with the standard keys', () => {
    const schedule = buildScheduleFromHabits([{ name: 'Stretch', frequency: 7, preferredTime: 'morning' }]);
    expect(schedule.map(d => d.key)).toEqual(['fri', 'sat', 'sun', 'mon', 'tue', 'wed', 'thu']);
  });

  it('places a 3x/week habit on 3 distinct days, evenly spread', () => {
    const schedule = buildScheduleFromHabits([{ name: 'Exercise', frequency: 3, preferredTime: 'evening' }]);
    const daysWithSession = schedule.filter(d => d.sessions.length > 0);
    expect(daysWithSession).toHaveLength(3);
  });

  it('sorts a shared day by Morning -> Afternoon -> Evening -> Night', () => {
    // Both habits run every day, so they land on the same days.
    const schedule = buildScheduleFromHabits([
      { name: 'Meditate', frequency: 7, preferredTime: 'night' },
      { name: 'Stretch', frequency: 7, preferredTime: 'morning' },
    ]);
    const day = schedule.find(d => d.sessions.length > 0);
    expect(day.sessions[0].label).toBe('Stretch');
    expect(day.sessions[1].label).toBe('Meditate');
  });

  it('numbers sessions only when frequency > 1', () => {
    const schedule = buildScheduleFromHabits([
      { name: 'Stretch', frequency: 1, preferredTime: 'morning' },
      { name: 'Exercise', frequency: 2, preferredTime: 'evening' },
    ]);
    const allSessions = schedule.flatMap(d => d.sessions);
    const stretch = allSessions.find(s => s.tagId === 'stretch');
    const exerciseIds = allSessions.filter(s => s.tagId === 'exercise').map(s => s.id);
    expect(stretch.id).toBe('stretch');
    expect(exerciseIds).toEqual(expect.arrayContaining(['exercise-1', 'exercise-2']));
  });
});

describe('onboarding flag', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows onboarding for a fresh install and not after markOnboarded()', () => {
    expect(isOnboarded()).toBe(false);
    expect(shouldShowOnboarding()).toBe(true);

    markOnboarded();

    expect(isOnboarded()).toBe(true);
    expect(shouldShowOnboarding()).toBe(false);
  });

  it('does not show onboarding if schedule/tags already exist (e.g. synced account)', () => {
    localStorage.setItem('ls-schedule', '[]');
    expect(shouldShowOnboarding()).toBe(false);
  });
});
