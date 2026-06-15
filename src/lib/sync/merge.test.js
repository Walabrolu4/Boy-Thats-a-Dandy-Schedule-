import { describe, it, expect } from 'vitest';
import { mergeState } from './merge.js';

describe('mergeState (LWW CRDT)', () => {

  it('should prefer cloud when local is empty', () => {
    const local = { checked: {}, tasks: {} };
    const cloud = {
      checked: { 'day1-sess1': { value: true, updatedAt: 100 } },
      tasks: {}
    };

    const result = mergeState(local, cloud);
    expect(result.checked['day1-sess1'].value).toBe(true);
  });

  it('should prefer local when cloud is empty', () => {
    const local = {
      checked: { 'day1-sess1': { value: true, updatedAt: 100 } },
      tasks: {}
    };
    const cloud = { checked: {}, tasks: {} };

    const result = mergeState(local, cloud);
    expect(result.checked['day1-sess1'].value).toBe(true);
  });

  it('should merge disparate keys from both local and cloud', () => {
    const local = {
      checked: { 'local-sess': { value: true, updatedAt: 100 } },
      tasks: {}
    };
    const cloud = {
      checked: { 'cloud-sess': { value: true, updatedAt: 200 } },
      tasks: {}
    };

    const result = mergeState(local, cloud);
    expect(result.checked['local-sess'].value).toBe(true);
    expect(result.checked['cloud-sess'].value).toBe(true);
  });

  it('should resolve conflicts using LWW timestamps (cloud wins)', () => {
    const local = {
      checked: { 'conflict-sess': { value: false, updatedAt: 100 } },
      tasks: {}
    };
    const cloud = {
      checked: { 'conflict-sess': { value: true, updatedAt: 200 } },
      tasks: {}
    };

    const result = mergeState(local, cloud);
    expect(result.checked['conflict-sess'].value).toBe(true);
    expect(result.checked['conflict-sess'].updatedAt).toBe(200);
  });

  it('should resolve conflicts using LWW timestamps (local wins)', () => {
    const local = {
      checked: { 'conflict-sess': { value: true, updatedAt: 300 } },
      tasks: {}
    };
    const cloud = {
      checked: { 'conflict-sess': { value: false, updatedAt: 200 } },
      tasks: {}
    };

    const result = mergeState(local, cloud);
    expect(result.checked['conflict-sess'].value).toBe(true);
    expect(result.checked['conflict-sess'].updatedAt).toBe(300);
  });

  it('should resolve task conflicts using LWW', () => {
    const local = {
      tasks: { 'task-1': { value: true, updatedAt: 500 } },
      checked: {}
    };
    const cloud = {
      tasks: { 'task-1': { value: false, updatedAt: 400 } },
      checked: {}
    };

    const result = mergeState(local, cloud);
    expect(result.tasks['task-1'].value).toBe(true);
  });
});
