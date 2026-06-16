import { StorageAdapter } from './StorageAdapter.js';

export class LocalStorageAdapter extends StorageAdapter {
  getSync(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Failed to parse local storage key: ${key}`, e);
      return null;
    }
  }

  setSync(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to stringify/save local storage key: ${key}`, e);
    }
  }

  keys() {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) result.push(k);
    }
    return result;
  }
}

// Singleton instance for the local storage engine
export const localStoreAdapter = new LocalStorageAdapter();
