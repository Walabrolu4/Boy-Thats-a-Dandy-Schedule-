<script>
  import { onMount } from 'svelte';
  import MvwChips from './components/MvwChips.svelte';
  import WeekGrid from './components/WeekGrid.svelte';
  import TasksSection from './components/TasksSection.svelte';
  import ReviewCard from './components/ReviewCard.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import StatsDashboard from './components/StatsDashboard.svelte';
  import HydratingOverlay from './components/HydratingOverlay.svelte';
  import OnboardingWizard from './components/OnboardingWizard.svelte';
  import SyncConflictModal from './components/SyncConflictModal.svelte';
  import { getWeekRange, getWeekLabel, getTheme, shouldShowOnboarding } from './lib/storage.js';
  import { DEFAULT_TAGS, DEFAULT_DAYS, DEFAULT_TASKS } from './lib/data.js';
  import { generateDummyStats } from './lib/stats.js';
  import { globalStore, toggleEditMode } from './lib/store.svelte.js';
  import { syncEngine } from './lib/sync/SyncEngine.js';

  let weekRange = $derived(getWeekRange(globalStore.weekOffset));
  let weekLabel = $derived(getWeekLabel(globalStore.weekOffset));
  let showManageGoals = $state(false);
  let showSettings = $state(false);
  let showStats = $state(false);
  let showOnboarding = $state(false);
  let showSyncConflict = $state(false);
  let syncConflictResolve = null;

  function resolveSyncConflict(choice) {
    if (syncConflictResolve) syncConflictResolve(choice);
    syncConflictResolve = null;
  }

  // Apply the theme on initial load
  let initialTheme = getTheme();
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', initialTheme);
  }



  function toggleManageGoals() {
    showManageGoals = !showManageGoals;
  }
  function toggleSettings() {
    showSettings = !showSettings;
  }

  onMount(async () => {
    syncEngine.onConflict(() => new Promise(resolve => {
      syncConflictResolve = resolve;
      showSyncConflict = true;
    }));

    globalStore.isHydrating = true;
    await syncEngine.hydrate();
    globalStore.isHydrating = false;
    if (shouldShowOnboarding()) showOnboarding = true;
  });
</script>

<div class="app">

  <div class="header">
    <div class="header-left">
      <h1>🌸 Now that's a Dandy Routine! 🌸</h1>
      <div class="week-label">{weekLabel}{weekLabel !== weekRange ? ` · ${weekRange}` : ''}</div>
    </div>
    <div class="header-btns">

      <button class="btn" onclick={() => showStats = true} title="View analytics" aria-label="View Stats Dashboard">Stats</button>
      <button class="btn {showManageGoals ? 'active' : ''}" onclick={toggleManageGoals} aria-label="{showManageGoals ? 'Close manage goals' : 'Open manage goals'}">
        {showManageGoals ? 'Close goals' : 'Manage goals'}
      </button>
      <button class="btn {globalStore.editMode ? 'active' : ''}" id="editBtn" onclick={toggleEditMode} disabled={globalStore.weekOffset < 0} title={globalStore.weekOffset < 0 ? "Can't edit the schedule for past weeks" : ''} aria-label="Toggle schedule edit mode">
        Edit schedule
      </button>
      <button class="btn" onclick={toggleSettings} title="Settings & Data" aria-label="Settings">⚙️</button>
      <div class="sync-status {globalStore.syncStatus}" title={globalStore.syncStatus === 'disabled' ? 'Cloud sync is off' : `Sync status: ${globalStore.syncStatus}`}>
        {#if globalStore.syncStatus === 'synced'}🟢
        {:else if globalStore.syncStatus === 'syncing'}🟡
        {:else if globalStore.syncStatus === 'pending'}🔴
        {:else if globalStore.syncStatus === 'offline'}🌑
        {:else if globalStore.syncStatus === 'disabled'}⚪{/if}
      </div>
    </div>
  </div>

  <div class="content-container {showManageGoals ? 'showing-goals' : ''}">
    <MvwChips bind:showConfig={showManageGoals} />

    <WeekGrid />
    
    <TasksSection />
  </div>

  <ReviewCard />

  <HydratingOverlay isHydrating={globalStore.isHydrating} />
</div>

<SettingsModal bind:showSettings={showSettings} />
<StatsDashboard bind:showStats={showStats} />
<OnboardingWizard bind:showWizard={showOnboarding} />
<SyncConflictModal bind:show={showSyncConflict} onResolve={resolveSyncConflict} />

<footer class="app-footer">
  <span class="footer-rule"></span>
  <span class="footer-content">
    a DMS app
    <img src="/dms_logo_temp.png" alt="DMS" class="footer-logo">, 2026
  </span>
  <span class="footer-rule"></span>
</footer>
