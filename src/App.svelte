<script>
  import { onMount } from 'svelte';
  import MvwChips from './components/MvwChips.svelte';
  import WeekGrid from './components/WeekGrid.svelte';
  import TasksSection from './components/TasksSection.svelte';
  import ReviewCard from './components/ReviewCard.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import StatsDashboard from './components/StatsDashboard.svelte';
  import HydratingOverlay from './components/HydratingOverlay.svelte';
  import { getWeekRange, getTheme } from './lib/storage.js';
  import { DEFAULT_TAGS, DEFAULT_DAYS, DEFAULT_TASKS } from './lib/data.js';
  import { generateDummyStats } from './lib/stats.js';
  import { globalStore, toggleEditMode } from './lib/store.svelte.js';
  import { syncEngine } from './lib/sync/SyncEngine.js';

  let weekRange = $state(getWeekRange());
  let showManageGoals = $state(false);
  let showSettings = $state(false);
  let showStats = $state(false);

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
    globalStore.isHydrating = true;
    await syncEngine.hydrate();
    globalStore.isHydrating = false;
  });
</script>

<div class="app">

  <div class="header">
    <div class="header-left">
      <h1>🌸 Now that's a Dandy Routine! 🌸</h1>
      <div class="week-label">{weekRange}</div>
    </div>
    <div class="header-btns">

      <div class="sync-status {globalStore.syncStatus}" title="Sync status: {globalStore.syncStatus}">
        {#if globalStore.syncStatus === 'synced'}🟢
        {:else if globalStore.syncStatus === 'syncing'}🟡
        {:else if globalStore.syncStatus === 'pending'}🔴
        {:else if globalStore.syncStatus === 'offline'}🌑{/if}
      </div>
      <button class="btn" onclick={() => showStats = true} title="View analytics" aria-label="View Stats Dashboard">📊 Stats</button>
      <button class="btn {showManageGoals ? 'active' : ''}" onclick={toggleManageGoals} aria-label="{showManageGoals ? 'Close manage goals' : 'Open manage goals'}">
        {showManageGoals ? 'Close goals' : 'Manage goals'}
      </button>
      <button class="btn {globalStore.editMode ? 'active' : ''}" id="editBtn" onclick={toggleEditMode} aria-label="Toggle schedule edit mode">
        Edit schedule
      </button>
      <button class="btn" onclick={toggleSettings} title="Settings & Data" aria-label="Settings">⚙️</button>
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

<footer class="app-footer">
  <span class="footer-rule"></span>
  <span class="footer-content">
    a DMS app
    <img src="/dms_logo_temp.png" alt="DMS" class="footer-logo">, 2026
  </span>
  <span class="footer-rule"></span>
</footer>
