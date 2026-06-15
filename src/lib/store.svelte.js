import { getState, saveState, hasWeekData } from './storage.js';
import { syncEngine } from './sync/SyncEngine.js';

export const globalStore = $state({
  weekState: getState(),
  weekOffset: 0,
  editMode: false,
  scheduleVersion: 0,
  syncStatus: 'synced',
  isHydrating: false
});

syncEngine.onStatusChange(status => {
  globalStore.syncStatus = status;
});

if (typeof window !== 'undefined') {
  window.addEventListener('dms-hydrated', () => {
    reloadGlobalState();
  });
}

export function saveGlobalState() {
  saveState(globalStore.weekState, globalStore.weekOffset);
  syncEngine.schedulePush();
}

export function reloadGlobalState() {
  globalStore.weekState = getState(globalStore.weekOffset);
  // We don't have reactive stores for tasks/schedule yet, but we could add them
  // For now we just bump scheduleVersion to force derived tags to recompute
  globalStore.scheduleVersion++;
}

// Navigate to a different week (delta: -1 = back, +1 = forward).
// Capped at one week ahead of the real current week; going back is allowed
// only as far as weeks that actually have saved historical data.
export function setWeekOffset(delta) {
  const next = globalStore.weekOffset + delta;
  if (next > 1) return;
  if (next < 0 && !hasWeekData(next)) return;
  globalStore.weekOffset = next;
  globalStore.weekState = getState(next);
  // The schedule can't be edited while viewing a past week (it shows a frozen snapshot).
  if (next < 0) globalStore.editMode = false;
}

// Jump straight back to the real current week.
export function goToThisWeek() {
  globalStore.weekOffset = 0;
  globalStore.weekState = getState(0);
}

export function toggleEditMode() {
  // Past weeks show a frozen schedule snapshot - editing (schedule or tasks) isn't allowed.
  if (globalStore.weekOffset < 0) return;
  globalStore.editMode = !globalStore.editMode;
}

export function incrementScheduleVersion() {
  globalStore.scheduleVersion += 1;
  // Tasks/schedule/tags edits weren't marked for sync at all before - push them now
  // so a refresh shortly after doesn't get clobbered by an older cloud copy.
  syncEngine.schedulePush();
  syncEngine.flush();
}
