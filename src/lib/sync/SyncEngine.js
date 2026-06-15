import { getSyncConfig, exportData, importData } from '../storage.js';
import { githubAdapter } from './GitHubAdapter.js';
import { supabaseAdapter } from './SupabaseAdapter.js';
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

    this.cloudVersion = null;
    this.supabaseUser = null;
    this.unsubscribeAuth = null;
    this.conflictCallback = null;
    this.refreshAuthSubscription();
  }

  /**
   * Registers a callback invoked when a sign-in hydrate finds that this
   * device's tags/schedule/tasks/theme differ from the cloud copy. The
   * callback must return a Promise resolving to 'local' or 'cloud'.
   */
  onConflict(callback) {
    this.conflictCallback = callback;
  }

  /**
   * (Re)subscribes to Supabase auth state changes using the current sync config.
   * Call this whenever the Supabase URL/anon key in the sync config change.
   */
  refreshAuthSubscription() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
    this.unsubscribeAuth = supabaseAdapter.onAuthStateChange(user => {
      const wasSignedIn = !!this.supabaseUser;
      this.supabaseUser = user;
      this.cloudVersion = null;

      if (user && !wasSignedIn) {
        // Just signed in - pull and merge cloud state for this account
        this.hydrate({ checkConflict: true });
      } else if (!user && wasSignedIn) {
        // Signed out - nothing left to push to this account
        this.pending = false;
      }
      this.emitStatus();
    });
  }

  /**
   * Returns the active storage adapter for the current sync config, or null
   * if sync isn't configured/ready (e.g. no token, or not signed in).
   */
  async getAdapter(config) {
    if (config.provider === 'github') {
      return config.githubToken ? githubAdapter : null;
    }
    if (config.provider === 'supabase') {
      const user = await supabaseAdapter.getUser();
      return user ? supabaseAdapter : null;
    }
    return null;
  }

  onStatusChange(callback) {
    this.statusCallback = callback;
    this.emitStatus();
  }

  emitStatus() {
    if (!this.statusCallback) return;

    const config = getSyncConfig();
    const active = (config.provider === 'github' && !!config.githubToken)
      || (config.provider === 'supabase' && !!this.supabaseUser);

    if (!active) {
      this.statusCallback('disabled');
    } else if (!this.isOnline) {
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
    const adapter = await this.getAdapter(config);
    if (!adapter) {
      // Simulate network delay for purely local dev / not-yet-configured sync
      await new Promise(r => setTimeout(r, 600));
      this.pending = false;
      return;
    }

    this.syncing = true;
    this.emitStatus();

    try {
      const payload = exportData();

      try {
        const newVersion = await adapter.set(payload, this.cloudVersion);
        this.cloudVersion = newVersion;
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

  async hydrate({ checkConflict = false } = {}) {
    if (!this.isOnline) return;
    const config = getSyncConfig();
    const adapter = await this.getAdapter(config);
    if (!adapter) return;

    this.syncing = true;
    this.emitStatus();

    try {
      // Push any local edits still pending before pulling, so a stale cloud
      // copy doesn't clobber them on import below.
      if (this.pending) {
        try {
          this.cloudVersion = await adapter.set(exportData(), this.cloudVersion);
          this.pending = false;
        } catch (e) {
          if (e.message !== '409_CONFLICT') throw e;
          // Cloud has newer data than our cached version - fall through to pull+merge.
        }
      }

      const response = await adapter.get();
      if (response && response.data) {
        this.cloudVersion = response.version;
        const cloudData = response.data;
        const localData = exportData();

        // Merge every week present on either side using CRDTs
        const weekKeys = new Set([
          ...Object.keys(localData).filter(k => k.startsWith('ls-week-')),
          ...Object.keys(cloudData).filter(k => k.startsWith('ls-week-'))
        ]);
        for (const weekKey of weekKeys) {
          cloudData[weekKey] = mergeState(localData[weekKey], cloudData[weekKey]);
        }

        // tags/schedule/tasks/theme have no per-field timestamps, so on sign-in
        // (when local edits may have happened while signed out) ask the user
        // which copy to keep - but only if this device actually has week
        // history worth protecting. A device with no ls-week-* entries has
        // nothing real to lose (even if it just ran onboarding), so the
        // cloud copy always wins silently in that case.
        const localHasHistory = Object.keys(localData).some(k => k.startsWith('ls-week-'));
        let keptLocal = false;
        if (checkConflict && localHasHistory) {
          const blobKeys = ['tags', 'schedule', 'tasks', 'theme'];
          const differs = blobKeys.some(k => JSON.stringify(localData[k]) !== JSON.stringify(cloudData[k]));
          if (differs && this.conflictCallback) {
            const choice = await this.conflictCallback();
            if (choice === 'local') {
              keptLocal = true;
              for (const k of blobKeys) cloudData[k] = localData[k];
            }
          }
        }

        // Import everything else (LWW override by cloud, unless local was chosen above)
        importData(cloudData);
        window.dispatchEvent(new CustomEvent('dms-hydrated'));

        if (keptLocal) {
          this.cloudVersion = await adapter.set(exportData(), this.cloudVersion);
        }
      } else {
        // No cloud row yet for this account - push local state to create it.
        this.cloudVersion = await adapter.set(exportData(), null);
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
