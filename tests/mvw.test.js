import { describe, it, expect, vi } from 'vitest';
import { getMVW } from '../src/lib/mvw.js';

vi.mock('../src/lib/storage.js', () => {
  return {
    getSchedule: () => [
      { key: 'mon', jsDay: 1, sessions: [
        { id: 's1', tagId: 'stretch' },
        { id: 's2', tagId: 'exer' },
        { id: 's3', tagId: 'prog' }
      ]}
    ],
    getTasks: () => [
      { id: 't1', tagId: 'reading' } // Floating task
    ],
    getTagsSync: () => [
      { id: 'stretch', label: 'Stretch', mvwTarget: 2, mvwOutOf: 7 }, // Custom: 2 instead of 5
      { id: 'meditate', label: 'Meditate', mvwTarget: 0, mvwOutOf: 7 }, // Hidden
      { id: 'prog', label: 'Programming', mvwTarget: 1 },
      { id: 'draw', label: 'Drawing', mvwTarget: 0 },
      { id: 'exer', label: 'Exercise', mvwTarget: 1, mvwOutOf: 3 }, // Custom: 1 instead of 2
      { id: 'reading', label: 'Reading', mvwTarget: 1 }
    ]
  };
});

describe('Unified Tags MVW Logic', () => {
  it('respects custom targets across scheduled blocks and floating tasks', () => {
    const state = {
      checked: {
        'mon-s1': true, // 1 stretch
        'mon-s2': true, // 1 exercise
        'mon-s3': true  // 1 prog
      },
      tasks: {
        't1': true      // 1 reading task done
      }
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

    // meditate, draw should be hidden because target is 0
    expect(chips.find(c => c.id === 'meditate')).toBeUndefined();
    expect(chips.find(c => c.id === 'draw')).toBeUndefined();
    
    // prog should be done
    expect(chips.find(c => c.id === 'prog').done).toBe(true);

    // reading task should be done
    expect(chips.find(c => c.id === 'reading').done).toBe(true);
  });
});
