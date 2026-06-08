import { describe, it, expect, vi } from 'vitest';
import { getMVW } from '../src/lib/mvw.js';

// Mock storage to provide custom config and schedule
vi.mock('../src/lib/storage.js', () => {
  return {
    getSchedule: () => [
      { key: 'mon', jsDay: 1, sessions: [
        { id: 's1', type: 'anchor', label: 'Morning stretch' },
        { id: 's2', type: 'exer', label: 'Gym' },
        { id: 's3', type: 'prog', label: 'Coding' }
      ]}
    ],
    getTasks: () => [],
    getMVWConfig: () => ({
      stretch:  { target: 2, outOf: 7 }, // Custom: 2 instead of 5
      meditate: { target: 0, outOf: 7 }, // Hidden
      prog:     { target: 1 },
      draw:     { target: 0 },
      keys:     { target: 0 },
      exer:     { target: 1, outOf: 3 }  // Custom: 1 instead of 2
    })
  };
});

describe('Dynamic MVW Logic', () => {
  it('respects custom targets', () => {
    const state = {
      checked: {
        'mon-s1': true, // 1 stretch
        'mon-s2': true, // 1 exercise
        'mon-s3': true  // 1 prog
      },
      tasks: {}
    };

    const chips = getMVW(state);

    // stretch should be partial because target is 2, we have 1
    const stretchChip = chips.find(c => c.id === 'stretch');
    expect(stretchChip.partial).toBe(true);
    expect(stretchChip.done).toBe(false);

    // exer should be done because target is 1, we have 1
    const exerChip = chips.find(c => c.id === 'exer');
    expect(exerChip.done).toBe(true);
    expect(exerChip.partial).toBe(false);

    // meditate, draw, keys should be hidden because target is 0
    expect(chips.find(c => c.id === 'meditate')).toBeUndefined();
    expect(chips.find(c => c.id === 'draw')).toBeUndefined();
    expect(chips.find(c => c.id === 'keys')).toBeUndefined();
    
    // prog should be done
    expect(chips.find(c => c.id === 'prog').done).toBe(true);
  });
});
