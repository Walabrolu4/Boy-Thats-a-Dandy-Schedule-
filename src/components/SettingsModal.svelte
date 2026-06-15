<script>
  import ThemePicker from './ThemePicker.svelte';
  import SeasonalWizard from './SeasonalWizard.svelte';
  import OnboardingWizard from './OnboardingWizard.svelte';

  import { getSyncConfig, saveSyncConfig } from '../lib/storage.js';
  import { syncEngine } from '../lib/sync/SyncEngine.js';
  import { supabaseAdapter } from '../lib/sync/SupabaseAdapter.js';

  let { showSettings = $bindable(false) } = $props();

  let fileInput = $state();
  let avatarInput = $state();
  let showSeasonalWizard = $state(false);
  let showOnboardingWizard = $state(false);

  function rerunOnboarding() {
    if (confirm("This will replace your current goals and schedule with a freshly generated week based on habits you list. Continue?")) {
      showOnboardingWizard = true;
    }
  }

  let syncConfig = $state(getSyncConfig());
  let showToken = $state(false);

  let supabaseUser = $state(null);
  let magicLinkEmail = $state('');
  let magicLinkStatus = $state('');
  let authBusy = $state(false);

  let profile = $state({ display_name: '', avatar_url: null });
  let profileStatus = $state('');
  let avatarBusy = $state(false);

  let syncStatusLabel = $derived.by(() => {
    if (syncConfig.provider === 'github') {
      const configured = syncConfig.githubUsername && syncConfig.githubRepo && syncConfig.githubToken;
      return configured
        ? `🐙 GitHub Sync — connected (${syncConfig.githubUsername}/${syncConfig.githubRepo})`
        : '🐙 GitHub Sync — not configured';
    }
    if (syncConfig.provider === 'supabase') {
      return supabaseUser ? `✨ Dandy Sync — signed in as ${supabaseUser.email}` : '✨ Dandy Sync — signed out';
    }
    return '🔘 Sync is off';
  });

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

  $effect(() => {
    if (syncConfig.provider === 'supabase' && supabaseUser) {
      supabaseAdapter.getProfile().then(p => {
        if (p) profile = { display_name: p.display_name || '', avatar_url: p.avatar_url };
      }).catch(() => {});
    }
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

  async function saveDisplayName() {
    profileStatus = '';
    try {
      await supabaseAdapter.updateProfile({ display_name: profile.display_name });
      profileStatus = 'Saved!';
    } catch (e) {
      profileStatus = 'Error: ' + e.message;
    }
  }

  function triggerAvatarUpload() {
    if (avatarInput) {
      avatarInput.click();
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    avatarBusy = true;
    profileStatus = '';
    try {
      profile.avatar_url = await supabaseAdapter.uploadAvatar(file);
    } catch (err) {
      profileStatus = 'Error: ' + err.message;
    } finally {
      avatarBusy = false;
      e.target.value = '';
    }
  }

  async function removeAvatar() {
    avatarBusy = true;
    profileStatus = '';
    try {
      await supabaseAdapter.removeAvatar();
      profile.avatar_url = null;
    } catch (err) {
      profileStatus = 'Error: ' + err.message;
    } finally {
      avatarBusy = false;
    }
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
  import { generateDummyStats } from '../lib/stats.js';

  function devReset() {
    if (!confirm('Nuke all localStorage data? This will reset the app entirely and run onboarding again.')) return;
    localStorage.clear();
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
      <div class="modal-header">
        <h3 style="margin: 0; font-size: 20px; color: var(--text);">Settings & Data</h3>
        <button class="close-btn" onclick={closeSettings} aria-label="Close settings" style="background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">×</button>
      </div>

      <div class="sync-status-line">{syncStatusLabel}</div>

      <details class="settings-section" open>
        <summary>App Theme</summary>
        <div class="section-body">
          <ThemePicker />
        </div>
      </details>

      <details class="settings-section" open={syncConfig.provider !== 'none'}>
        <summary>Sync</summary>
        <div class="section-body">
          <div class="provider-options">
            <label class="provider-option">
              <input type="radio" name="syncProvider" checked={syncConfig.provider === 'none'} onchange={() => syncConfig.provider = 'none'} />
              Off
            </label>
            <label class="provider-option">
              <input type="radio" name="syncProvider" checked={syncConfig.provider === 'github'} onchange={() => syncConfig.provider = 'github'} />
              GitHub Sync (Bring Your Own)
            </label>
            <label class="provider-option">
              <input type="radio" name="syncProvider" checked={syncConfig.provider === 'supabase'} onchange={() => syncConfig.provider = 'supabase'} />
              Dandy Sync (Managed)
            </label>
          </div>

          {#if syncConfig.provider === 'none'}
            <p class="section-hint">Pick a sync option above to keep your data in sync across devices.</p>
          {/if}

          {#if syncConfig.provider === 'github'}
            <p style="font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.5;">
              Enter a private GitHub repository and a Personal Access Token to sync your data across devices for free.<br />
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

          {#if syncConfig.provider === 'supabase'}
            <p style="font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.5;">
              Sign in with a magic link to sync your data across devices using the managed Dandy Sync backend.
            </p>
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
        </div>
      </details>

      {#if syncConfig.provider === 'supabase'}
        <details class="settings-section">
          <summary>Account</summary>
          <div class="section-body">
            {#if !supabaseUser}
              <p class="section-hint">Sign in to Dandy Sync above to set up your profile.</p>
            {:else}
              <div class="profile-row">
                {#if profile.avatar_url}
                  <img class="avatar-preview" src={profile.avatar_url} alt="Avatar" />
                {:else}
                  <div class="avatar-placeholder">{(profile.display_name || supabaseUser.email || '?').charAt(0).toUpperCase()}</div>
                {/if}
                <div class="avatar-actions">
                  <button class="settings-action-btn secondary" onclick={triggerAvatarUpload} disabled={avatarBusy}>
                    {avatarBusy ? 'Working…' : '🖼️ Change Avatar'}
                  </button>
                  {#if profile.avatar_url}
                    <button class="settings-action-btn secondary" onclick={removeAvatar} disabled={avatarBusy}>Remove</button>
                  {/if}
                  <input type="file" accept="image/*" bind:this={avatarInput} onchange={handleAvatarUpload} style="display: none;" />
                </div>
              </div>

              <input type="text" class="sync-input" placeholder="Display Name" bind:value={profile.display_name} onblur={saveDisplayName} />

              {#if profileStatus}
                <p class="section-hint">{profileStatus}</p>
              {/if}
            {/if}
          </div>
        </details>
      {/if}

      <details class="settings-section">
        <summary>Data Backup & Restore</summary>
        <div class="section-body">
          <p class="section-hint">
            Export your entire schedule, goals, tasks, and history to a single JSON file. You can import this file later to completely restore your setup.
          </p>
          <button class="settings-action-btn primary" onclick={handleExport}>
            📥 Export Data
          </button>
          <button class="settings-action-btn secondary" onclick={triggerImport}>
            📤 Import Data
          </button>
          <input type="file" accept=".json" bind:this={fileInput} onchange={handleImport} style="display: none;" />
        </div>
      </details>

      <details class="settings-section">
        <summary>Schedule Advanced</summary>
        <div class="section-body">
          <p class="section-hint">
            Automatically pack your existing scheduled sessions into specific available days when the season changes.
          </p>
          <button class="settings-action-btn secondary" onclick={() => showSeasonalWizard = true}>
            🍂 Seasonal Re-mapping
          </button>
          <button class="settings-action-btn secondary" onclick={rerunOnboarding}>
            ✨ Re-run Habit Setup
          </button>
        </div>
      </details>

      <details class="settings-section">
        <summary>Developer Tools</summary>
        <div class="section-body">
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
      </details>
    </div>
  </div>
{/if}

<SeasonalWizard bind:showWizard={showSeasonalWizard} onComplete={() => { showSeasonalWizard = false; window.location.reload(); }} />
<OnboardingWizard bind:showWizard={showOnboardingWizard} dismissable={true} onComplete={() => { showOnboardingWizard = false; window.location.reload(); }} />

<style>
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .sync-status-line {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--surface-hover);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 16px;
  }

  .settings-section {
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 10px;
    overflow: hidden;
  }

  .settings-section > summary {
    list-style: none;
    cursor: pointer;
    padding: 12px 14px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .settings-section > summary::-webkit-details-marker {
    display: none;
  }

  .settings-section > summary::after {
    content: '▾';
    color: var(--text-muted);
    transition: transform 0.2s ease;
  }

  .settings-section[open] > summary::after {
    transform: rotate(180deg);
  }

  .settings-section > summary:hover {
    background: var(--surface-hover);
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 14px 16px 14px;
  }

  .section-hint {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .provider-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .provider-option {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 14px;
  }

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

  .profile-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar-preview {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--border);
    flex-shrink: 0;
  }

  .avatar-placeholder {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--purple-bg);
    color: var(--purple);
    border: 1px solid var(--purple-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .avatar-actions .settings-action-btn {
    width: auto;
  }
</style>
