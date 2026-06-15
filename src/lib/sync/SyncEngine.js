import { getSyncConfig, exportData, importData, getWeekKey } from '../storage.js';
import { githubAdapter } from './GitHubAdapter.js';
import { mergeState } from './merge.js';

export class SyncEngine {
  constructor() {
    this.statusCallback = null;
    this.debounceTimer = null;
    this.isOnline = navigator.onLine;
    this.syncing = false;
    this.pending = false;

    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.pending) {
        this.flush(); // Force a flush if user closes/hides the app
      }
    });

    this.cloudSha = null;
  }

  onStatusChange(callback) {
    this.statusCallback = callback;
    this.emitStatus();
  }

  emitStatus() {
    if (!this.statusCallback) return;
    if (!this.isOnline) {
      this.statusCallback('offline');
    } else if (this.syncing) {
      this.statusCallback('syncing');
    } else if (this.pending) {
      this.statusCallback('pending');
    } else {
      this.statusCallback('synced');
    }
  }

  handleOnline() {
    this.isOnline = true;
    if (this.pending) {
      this.flush();
    } else {
      this.emitStatus();
    }
  }

  handleOffline() {
    this.isOnline = false;
    this.emitStatus();
  }

  // Called whenever local state changes
  schedulePush() {
    this.pending = true;
    this.emitStatus();

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    
    // Debounce for 5 seconds to prevent hammering the cloud
    this.debounceTimer = setTimeout(() => {
      if (this.isOnline) this.flush();
    }, 5000);
  }

  async flush() {
    if (!this.isOnline || this.syncing || !this.pending) return;

    const config = getSyncConfig();
    if (config.provider !== 'github' || !config.githubToken) {
      // Simulate network delay for purely local dev
      await new Promise(r => setTimeout(r, 600));
      this.pending = false;
      return;
    }

    this.syncing = true;
    this.emitStatus();

    try {
      const payload = exportData();
      
      try {
        const newSha = await githubAdapter.set(payload, this.cloudSha);
        this.cloudSha = newSha;
        this.pending = false;
      } catch (e) {
        if (e.message === '409_CONFLICT') {
          console.warn('Sync conflict detected! Forcing hydrate and re-push...');
          await this.hydrate();
          // hydrate will automatically merge, save, and we should push again next cycle
          this.pending = true; // ensure it retries
        } else {
          throw e;
        }
      }
    } catch (e) {
      console.error('Sync failed:', e);
      // Keep pending = true so it retries next time
    } finally {
      this.syncing = false;
      this.emitStatus();
    }
  }

  async hydrate() {
    if (!this.isOnline) return;
    const config = getSyncConfig();
    if (config.provider !== 'github' || !config.githubToken) return;

    this.syncing = true;
    this.emitStatus();

    try {
      const response = await githubAdapter.get();
      if (response && response.data) {
        this.cloudSha = response.sha;
        const cloudData = response.data;
        const localData = exportData();
        
        // Merge the current week's state specifically using CRDTs
        const weekKey = getWeekKey();
        if (cloudData[weekKey]) {
          cloudData[weekKey] = mergeState(localData[weekKey], cloudData[weekKey]);
        }
        
        // Import everything else (LWW override by cloud)
        importData(cloudData);
        window.dispatchEvent(new CustomEvent('dms-hydrated'));
      }
    } catch (e) {
      console.error('Hydration failed:', e);
    } finally {
      this.syncing = false;
      this.emitStatus();
    }
  }
}

export const syncEngine = new SyncEngine();
