import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import WeekGrid from '../src/components/WeekGrid.svelte';
import * as storage from '../src/lib/storage.js';

// Mock the data/storage layer
vi.mock('../src/lib/storage.js', () => {
  let mockSchedule = [
    { key: 'mon', jsDay: 1, label: 'Monday', sessions: [{ id: 's1', label: 'Yoga', type: 'exer' }, { id: 's2', label: 'Draw', type: 'draw' }] },
    { key: 'tue', jsDay: 2, label: 'Tuesday', sessions: [] }
  ];
  return {
    getSchedule: () => JSON.parse(JSON.stringify(mockSchedule)),
    saveSchedule: (s) => { mockSchedule = JSON.parse(JSON.stringify(s)); },
    getState: () => ({ checked: {} }),
    getTagsSync: () => [
      { id: 'exer', label: 'Exercise', color: '#3DD68C' },
      { id: 'draw', label: 'Drawing', color: '#FFD700' }
    ],
    getSyncConfig: () => ({ provider: 'none', githubToken: '' })
  };
});

describe('Touch Reorder Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('long press (500ms) enters reorder mode and shows arrows', async () => {
    const { getByText, queryByText } = render(WeekGrid, { 
      weekState: { checked: {} }, 
      editMode: false, 
      scheduleVersion: 1, 
      onStateChange: () => {}, 
      onScheduleChange: () => {} 
    });

    const session = getByText('Yoga');
    
    // Arrows shouldn't exist initially
    expect(queryByText('↑')).toBeNull();

    // Start touch
    await fireEvent.touchStart(session);

    // Fast touch (under 500ms) should not trigger reorder
    vi.advanceTimersByTime(200);
    await fireEvent.touchEnd(session);
    
    // DOM updates asynchronously
    await Promise.resolve();
    expect(queryByText('↑')).toBeNull();

    // Long press
    await fireEvent.touchStart(session);
    vi.advanceTimersByTime(500);
    
    // Await ticks for svelte reactivity
    await Promise.resolve();
    
    // Now the reorder mode should be active
    expect(getByText('↑')).toBeTruthy();
    expect(getByText('↓')).toBeTruthy();
  });
});
