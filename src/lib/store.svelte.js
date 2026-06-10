import { getState, saveState } from './storage.js';

export const globalStore = $state({
  weekState: getState(),
  editMode: false,
  scheduleVersion: 0
});

export function saveGlobalState() {
  saveState(globalStore.weekState);
}

export function toggleEditMode() {
  globalStore.editMode = !globalStore.editMode;
}

export function incrementScheduleVersion() {
  globalStore.scheduleVersion += 1;
}
