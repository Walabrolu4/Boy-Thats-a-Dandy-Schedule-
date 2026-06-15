import { getState, saveState } from './storage.js';
import { syncEngine } from './sync/SyncEngine.js';

export const globalStore = $state({
  weekState: getState(),
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
  saveState(globalStore.weekState);
  syncEngine.schedulePush();
}

export function reloadGlobalState() {
  globalStore.weekState = getState();
  // We don't have reactive stores for tasks/schedule yet, but we could add them
  // For now we just bump scheduleVersion to force derived tags to recompute
  globalStore.scheduleVersion++;
}

export function toggleEditMode() {
  globalStore.editMode = !globalStore.editMode;
}

export function incrementScheduleVersion() {
  globalStore.scheduleVersion += 1;
}
