<script>
  import { onMount } from 'svelte';
  import MvwChips from './components/MvwChips.svelte';
  import WeekGrid from './components/WeekGrid.svelte';
  import TasksSection from './components/TasksSection.svelte';
  import ReviewCard from './components/ReviewCard.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import StatsDashboard from './components/StatsDashboard.svelte';
  import { getWeekKey, getState, saveState, getWeekRange, getTheme } from './lib/storage.js';
  import { DEFAULT_TAGS, DEFAULT_DAYS, DEFAULT_TASKS } from './lib/data.js';
  import { generateDummyStats } from './lib/stats.js';

  let weekRange = $state(getWeekRange());
  let weekState = $state(getState());
  let editMode = $state(false);
  let scheduleVersion = $state(0);
  let showManageGoals = $state(false);
  let showSettings = $state(false);
  let showStats = $state(false);

  // Apply the theme on initial load
  let initialTheme = getTheme();
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', initialTheme);
  }

  function handleStateChange(newState) {
    weekState = { ...newState };
    saveState(weekState);
  }
  function handleScheduleChange() {
    scheduleVersion += 1;
  }
  function resetWeek() {
    if (!confirm(`Clear all checkmarks and review for ${weekRange}?`)) return;
    localStorage.removeItem(getWeekKey());
    weekState = getState();
  }
  function toggleEditMode() {
    editMode = !editMode;
  }
  function toggleManageGoals() {
    showManageGoals = !showManageGoals;
  }
  function toggleSettings() {
    showSettings = !showSettings;
  }
</script>

<div class="app">

  <div class="header">
    <div class="header-left">
      <h1>🌸 Boy, That's a Dandy Schedule! 🌸</h1>
      <div class="week-label">{weekRange}</div>
    </div>
    <div class="header-btns">
      <button class="btn" onclick={() => showStats = true} title="View analytics" aria-label="View Stats Dashboard">📊 Stats</button>
      <button class="btn {showManageGoals ? 'active' : ''}" onclick={toggleManageGoals} aria-label="{showManageGoals ? 'Close manage goals' : 'Open manage goals'}">
        {showManageGoals ? 'Close goals' : 'Manage goals'}
      </button>
      <button class="btn {editMode ? 'active' : ''}" id="editBtn" onclick={toggleEditMode} aria-label="Toggle schedule edit mode">
        Edit schedule
      </button>
      <button class="btn" onclick={resetWeek} aria-label="Reset current week">Reset week</button>
      <button class="btn" onclick={toggleSettings} title="Settings & Data" aria-label="Settings">⚙️</button>
    </div>
  </div>

  <div class="content-container {showManageGoals ? 'showing-goals' : ''}">
    {#if showManageGoals}
      <MvwChips {scheduleVersion} />
    {/if}

    <WeekGrid bind:weekState={weekState} {editMode} {scheduleVersion} onStateChange={handleStateChange} onScheduleChange={handleScheduleChange} />
    
    <TasksSection bind:weekState={weekState} {editMode} {scheduleVersion} onStateChange={handleStateChange} onScheduleChange={handleScheduleChange} />
  </div>

  <ReviewCard bind:weekState={weekState} onStateChange={handleStateChange} />
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
