<script>
  import MvwChips from './components/MvwChips.svelte';
  import WeekGrid from './components/WeekGrid.svelte';
  import TasksSection from './components/TasksSection.svelte';
  import ReviewCard from './components/ReviewCard.svelte';

  import { getState, saveState, getWeekRange, getSchedule } from './lib/storage.js';

  // ── App state ──
  let weekState = getState();
  let editMode = false;
  let weekGrid; // bind to WeekGrid for calling refresh()
  let tasksSection; // bind to TasksSection for calling refresh()

  $: weekRange = getWeekRange();

  // Called by child components whenever weekState is mutated
  function handleStateChange(newState) {
    weekState = newState;
    saveState(weekState);
  }

  function toggleEditMode() {
    editMode = !editMode;
    if (!editMode) {
      // Reset any open add forms by refreshing children
      if (weekGrid) weekGrid.refresh();
    }
  }

  function resetWeek() {
    if (!confirm('Reset all checkmarks for this week?')) return;
    weekState = { checked: {}, tasks: {}, review: { q1: '', q2: '', q3: '' } };
    saveState(weekState);
  }

  function devReset() {
    if (!confirm('Delete ALL app data (schedule + all weeks)? This cannot be undone.')) return;
    Object.keys(localStorage)
      .filter(k => k === 'ls-schedule' || k === 'ls-tasks' || k.startsWith('ls-week-'))
      .forEach(k => localStorage.removeItem(k));
    weekState = getState();
    editMode = false;
    if (weekGrid) weekGrid.refresh();
    if (tasksSection) tasksSection.refresh();
  }
</script>

<div class="app">

  <div class="header">
    <div class="header-left">
      <h1>🌸 Boy, That's a Dandy Schedule! 🌸</h1>
      <div class="week-label" id="weekLabel">{weekRange}</div>
    </div>
    <div class="header-btns">
      <button class="btn {editMode ? 'active' : ''}" id="editBtn" on:click={toggleEditMode}>
        Edit schedule
      </button>
      <button class="btn" on:click={resetWeek}>Reset week</button>
      <button class="btn btn-dev" on:click={devReset} title="Clears all app data from localStorage">
        dev: reset all
      </button>
    </div>
  </div>

  <MvwChips {weekState} />

  <WeekGrid
    bind:this={weekGrid}
    {weekState}
    {editMode}
    onStateChange={handleStateChange}
  />

  <div style="height: 1.5rem;"></div>

  <TasksSection
    bind:this={tasksSection}
    {weekState}
    {editMode}
    onStateChange={handleStateChange}
  />

  <div style="height: 1rem;"></div>

  <ReviewCard {weekState} onStateChange={handleStateChange} />

</div>

<footer class="app-footer">
  <span class="footer-rule"></span>
  <span class="footer-content">
    a DMS app
    <img src="/dms_logo_temp.png" alt="DMS" class="footer-logo">
    2026
  </span>
  <span class="footer-rule"></span>
</footer>
