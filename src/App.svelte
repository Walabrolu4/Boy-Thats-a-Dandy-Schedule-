<script>
  import { onMount } from 'svelte';
  import MvwChips from './components/MvwChips.svelte';
  import WeekGrid from './components/WeekGrid.svelte';
  import TasksSection from './components/TasksSection.svelte';
  import ReviewCard from './components/ReviewCard.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import { getWeekKey, getState, saveState, getWeekRange, getTheme } from './lib/storage.js';
  import { DEFAULT_TAGS, DEFAULT_DAYS, DEFAULT_TASKS } from './lib/data.js';

  let weekRange = $state(getWeekRange());
  let weekState = $state(getState());
  let editMode = $state(false);
  let scheduleVersion = $state(0);
  let showManageGoals = $state(false);
  let showSettings = $state(false);

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
      <button class="btn" onclick={toggleSettings} title="Settings & Data">⚙️</button>
      <button class="btn {showManageGoals ? 'active' : ''}" onclick={toggleManageGoals}>
        {showManageGoals ? 'Close goals' : 'Manage goals'}
      </button>
      <button class="btn {editMode ? 'active' : ''}" id="editBtn" onclick={toggleEditMode}>
        Edit schedule
      </button>
      <button class="btn" onclick={resetWeek}>Reset week</button>
      <button class="btn btn-dev" onclick={devPopulate} title="Inject past reviews">
        dev: add past
      </button>
      <button class="btn btn-dev" onclick={devReset} title="Clears all app data from localStorage">
        dev: reset all
      </button>
    </div>
  </div>

  <SettingsModal bind:showSettings />

  <MvwChips {weekState} {scheduleVersion} onScheduleChange={handleScheduleChange} bind:showConfig={showManageGoals} />

  <div style="height: 1.5rem;"></div>

  <WeekGrid
    {weekState}
    {editMode}
    {scheduleVersion}
    onStateChange={handleStateChange}
    onScheduleChange={handleScheduleChange}
  />

  <div style="height: 1.5rem;"></div>

  <TasksSection
    {weekState}
    {editMode}
    {scheduleVersion}
    onStateChange={handleStateChange}
    onScheduleChange={handleScheduleChange}
  />

  <div style="height: 1rem;"></div>

  <ReviewCard {weekState} onStateChange={handleStateChange} />

</div>

<footer class="app-footer">
  <span class="footer-rule"></span>
  <span class="footer-content">
    a DMS app
    <img src="/dms_logo_temp.png" alt="DMS" class="footer-logo">, 2026
  </span>
  <span class="footer-rule"></span>
</footer>
