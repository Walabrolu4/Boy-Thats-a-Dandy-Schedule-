<script>
  import ThemePicker from './ThemePicker.svelte';
  import SeasonalWizard from './SeasonalWizard.svelte';

  import { getSyncConfig, saveSyncConfig } from '../lib/storage.js';
  import { syncEngine } from '../lib/sync/SyncEngine.js';
  import { supabaseAdapter } from '../lib/sync/SupabaseAdapter.js';

  let { showSettings = $bindable(false) } = $props();

  let fileInput = $state();
  let showSeasonalWizard = $state(false);

  let syncConfig = $state(getSyncConfig());
  let showToken = $state(false);
  let showSupabaseKey = $state(false);

  let supabaseUser = $state(null);
  let magicLinkEmail = $state('');
  let magicLinkStatus = $state('');
  let authBusy = $state(false);

  $effect(() => {
    // Automatically save sync config when it changes
    saveSyncConfig(syncConfig);
    // Re-subscribe to auth using the (possibly just-changed) Supabase URL/key
    syncEngine.refreshAuthSubscription();
  });

  $effect(() => {
    const unsubscribe = supabaseAdapter.onAuthStateChange(user => {
      supabaseUser = user;
    });
    return unsubscribe;
  });

  async function sendMagicLink() {
    authBusy = true;
    magicLinkStatus = '';
    try {
      await supabaseAdapter.signInWithMagicLink(magicLinkEmail);
      magicLinkStatus = 'Check your email for a sign-in link!';
    } catch (e) {
      magicLinkStatus = 'Error: ' + e.message;
    } finally {
      authBusy = false;
    }
  }

  async function signOutDandySync() {
    await supabaseAdapter.signOut();
    magicLinkEmail = '';
    magicLinkStatus = '';
  }

  async function forceSync() {
    await syncEngine.hydrate();
  }

  function closeSettings() {
    showSettings = false;
  }

  function handleExport() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ls-')) {
        data[key] = localStorage.getItem(key);
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dms-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    if (fileInput) {
      fileInput.click();
    }
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (typeof data === 'object' && data !== null) {
          if (confirm('This will completely overwrite your current data. Are you sure?')) {
            for (const [key, value] of Object.entries(data)) {
              if (key.startsWith('ls-')) {
                localStorage.setItem(key, value);
              }
            }
            alert('Data imported successfully. The application will now reload.');
            window.location.reload();
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse the backup file. Ensure it is a valid JSON document.');
        console.error('Import error:', err);
      }
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  }
  import { DEFAULT_TAGS, DEFAULT_DAYS, DEFAULT_TASKS } from '../lib/data.js';
  import { generateDummyStats } from '../lib/stats.js';

  function devReset() {
    if (!confirm('Nuke all localStorage data? This will reset the app entirely.')) return;
    localStorage.clear();
    localStorage.setItem('ls-tags', JSON.stringify(DEFAULT_TAGS));
    localStorage.setItem('ls-schedule', JSON.stringify(DEFAULT_DAYS));
    localStorage.setItem('ls-tasks', JSON.stringify(DEFAULT_TASKS));
    window.location.reload();
  }
  
  function devPopulate() {
    if (!confirm('Inject 3 weeks of synthetic past reviews?')) return;
    const dummyReviews = [
      { key: 'ls-week-2026-05-15', data: { review: { q1: "Missed 2 workouts because I was travelling for work.", q2: "Getting back into the routine after the trip was tough.", q3: "My morning block, no matter what." } } },
      { key: 'ls-week-2026-05-22', data: { review: { q1: "Skipped painting because I didn't have my supplies set up.", q2: "Procrastination on the big refactor project.", q3: "Sunday evening planning session." } } },
      { key: 'ls-week-2026-05-29', data: { review: { q1: "None! Hit every session this week.", q2: "Felt a bit burnt out on Thursday.", q3: "More breaks between deep work sessions." } } }
    ];
    for (const item of dummyReviews) {
      localStorage.setItem(item.key, JSON.stringify(item.data));
    }
    window.location.reload();
  }
  
  function devMockStats() {
    if (!confirm('Inject mock stats for charts?')) return;
    generateDummyStats();
  }
</script>

{#if showSettings}
  <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={closeSettings}>
    <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" onclick={e => e.stopPropagation()}>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; font-size: 20px; color: var(--text);">Settings & Data</h3>
        <button class="close-btn" onclick={closeSettings} aria-label="Close settings" style="background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">×</button>
      </div>

      <h4 style="margin: 0 0 12px 0; font-size: 15px; color: var(--text);">App Theme</h4>
      <ThemePicker />

      <h4 style="margin: 24px 0 8px 0; font-size: 15px; color: var(--text);">Cloud Sync (GitHub)</h4>
      <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
        Bring Your Own Sync! Enter a private GitHub repository and a Personal Access Token to sync your data across devices for free.
      </p>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <label style="display: flex; gap: 8px; align-items: center; font-size: 14px;">
          <input type="checkbox" checked={syncConfig.provider === 'github'} onchange={(e) => syncConfig.provider = e.target.checked ? 'github' : 'none'} />
          Enable GitHub Sync
        </label>

        {#if syncConfig.provider === 'github'}
          <p style="font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.5;">
            1. Create a private GitHub repository (any name) to hold your synced data.<br />
            2. <a href="https://github.com/settings/tokens/new?description=Dandy+Routine+Sync&scopes=repo" target="_blank" rel="noopener noreferrer">Create a Personal Access Token</a> with the <code>repo</code> scope, then paste it below.
          </p>
          <input type="text" class="sync-input" placeholder="GitHub Username (e.g. octocat)" bind:value={syncConfig.githubUsername} />
          <input type="text" class="sync-input" placeholder="Repository Name (e.g. my-dandy-sync)" bind:value={syncConfig.githubRepo} />
          <div class="token-input-wrap">
            <input type={showToken ? 'text' : 'password'} class="sync-input" placeholder="Personal Access Token (classic or fine-grained)" bind:value={syncConfig.githubToken} />
            <button type="button" class="token-toggle-btn" onclick={() => showToken = !showToken} aria-label={showToken ? 'Hide token' : 'Show token'} title={showToken ? 'Hide token' : 'Show token'}>
              {showToken ? '🙈' : '👁️'}
            </button>
          </div>
          <button class="settings-action-btn primary" onclick={forceSync}>🔄 Force Sync Now</button>
        {/if}
      </div>

      <h4 style="margin: 24px 0 8px 0; font-size: 15px; color: var(--text);">Dandy Sync (Supabase)</h4>
      <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
        Sign in with a magic link to sync your data across devices using the managed Dandy Sync backend.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <label style="display: flex; gap: 8px; align-items: center; font-size: 14px;">
          <input type="checkbox" checked={syncConfig.provider === 'supabase'} onchange={(e) => syncConfig.provider = e.target.checked ? 'supabase' : 'none'} />
          Enable Dandy Sync
        </label>

        {#if syncConfig.provider === 'supabase'}
          <input type="text" class="sync-input" placeholder="Supabase Project URL" bind:value={syncConfig.supabaseUrl} />
          <div class="token-input-wrap">
            <input type={showSupabaseKey ? 'text' : 'password'} class="sync-input" placeholder="Supabase Anon Key" bind:value={syncConfig.supabaseAnonKey} />
            <button type="button" class="token-toggle-btn" onclick={() => showSupabaseKey = !showSupabaseKey} aria-label={showSupabaseKey ? 'Hide key' : 'Show key'} title={showSupabaseKey ? 'Hide key' : 'Show key'}>
              {showSupabaseKey ? '🙈' : '👁️'}
            </button>
          </div>

          {#if syncConfig.supabaseUrl && syncConfig.supabaseAnonKey}
            {#if supabaseUser}
              <p style="font-size: 14px; color: var(--text); margin: 0;">Signed in as <strong>{supabaseUser.email}</strong></p>
              <button class="settings-action-btn primary" onclick={forceSync}>🔄 Force Sync Now</button>
              <button class="settings-action-btn secondary" onclick={signOutDandySync}>Sign Out</button>
            {:else}
              <input type="email" class="sync-input" placeholder="you@example.com" bind:value={magicLinkEmail} />
              <button class="settings-action-btn primary" onclick={sendMagicLink} disabled={authBusy || !magicLinkEmail}>
                {authBusy ? 'Sending…' : '✉️ Send Magic Link'}
              </button>
              {#if magicLinkStatus}
                <p style="font-size: 13px; color: var(--text-muted); margin: 0;">{magicLinkStatus}</p>
              {/if}
            {/if}
          {/if}
        {/if}
      </div>

      <h4 style="margin: 24px 0 8px 0; font-size: 15px; color: var(--text);">Data Backup & Restore</h4>
      <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
        Export your entire schedule, goals, tasks, and history to a single JSON file. You can import this file later to completely restore your setup.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="settings-action-btn primary" onclick={handleExport}>
          📥 Export Data
        </button>
        
        <button class="settings-action-btn secondary" onclick={triggerImport}>
          📤 Import Data
        </button>
        <input type="file" accept=".json" bind:this={fileInput} onchange={handleImport} style="display: none;" />
      </div>

      <h4 style="margin: 24px 0 8px 0; font-size: 15px; color: var(--text);">Schedule Advanced</h4>
      <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
        Automatically pack your existing scheduled sessions into specific available days when the season changes.
      </p>
      <button class="settings-action-btn secondary" onclick={() => showSeasonalWizard = true}>
        🍂 Seasonal Re-mapping
      </button>

      <h4 style="margin: 32px 0 8px 0; font-size: 15px; color: var(--text);">Developer Tools</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="settings-action-btn secondary" style="font-size: 13px; padding: 8px;" onclick={devPopulate}>
          Inject Mock Past Reviews
        </button>
        <button class="settings-action-btn secondary" style="font-size: 13px; padding: 8px;" onclick={devMockStats}>
          Inject Mock Stats
        </button>
        <button class="settings-action-btn secondary" style="font-size: 13px; padding: 8px; border-color: #ff5555; color: #ff5555;" onclick={devReset}>
          Factory Reset App Data
        </button>
      </div>
    </div>
  </div>
{/if}

<SeasonalWizard bind:showWizard={showSeasonalWizard} onComplete={() => { showSeasonalWizard = false; window.location.reload(); }} />

<style>
  .sync-input {
    width: 100%;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface-hover);
    color: var(--text);
    font-size: 14px;
  }
  .token-input-wrap {
    position: relative;
    display: flex;
  }
  .token-input-wrap .sync-input {
    padding-right: 40px;
  }
  .token-toggle-btn {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 6px 8px;
    line-height: 1;
  }
  .settings-action-btn {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    border: 1px solid var(--border);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .settings-action-btn.primary {
    background: var(--purple-bg);
    color: var(--purple);
    border-color: var(--purple-dim);
  }
  .settings-action-btn.primary:hover {
    background: var(--purple);
    color: #fff;
  }

  .settings-action-btn.secondary {
    background: var(--surface-hover);
    color: var(--text);
  }
  .settings-action-btn.secondary:hover {
    background: var(--border-strong);
  }
</style>
