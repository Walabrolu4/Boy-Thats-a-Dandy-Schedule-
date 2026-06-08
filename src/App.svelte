<script>
  import MvwChips from './components/MvwChips.svelte';
  import WeekGrid from './components/WeekGrid.svelte';
  import TasksSection from './components/TasksSection.svelte';
  import ReviewCard from './components/ReviewCard.svelte';

  import { getState, saveState, getWeekRange } from './lib/storage.js';

  // weekState drives all checkmark/task/review rendering
  let weekState = $state(getState());
  // scheduleVersion increments whenever the schedule or tasks list changes,
  // telling WeekGrid / TasksSection to re-read from localStorage
  let scheduleVersion = $state(0);
  let editMode = $state(false);

  const weekRange = getWeekRange();

  function handleStateChange(newState) {
    weekState = { ...newState };
    saveState(weekState);
  }

  function handleScheduleChange() {
    scheduleVersion += 1;
  }

  function toggleEditMode() {
    editMode = !editMode;
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
    scheduleVersion += 1;
  }
</script>

<div class="app">

  <div class="header">
    <div class="header-left">
      <h1>🌸 Boy, That's a Dandy Schedule! 🌸</h1>
      <div class="week-label">{weekRange}</div>
    </div>
    <div class="header-btns">
      <button class="btn {editMode ? 'active' : ''}" id="editBtn" onclick={toggleEditMode}>
        Edit schedule
      </button>
      <button class="btn" onclick={resetWeek}>Reset week</button>
      <button class="btn btn-dev" onclick={devReset} title="Clears all app data from localStorage">
        dev: reset all
      </button>
    </div>
  </div>

  <MvwChips {weekState} {scheduleVersion} />

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
    <img src="/dms_logo_temp.png" alt="DMS" class="footer-logo">
    2026
  </span>
  <span class="footer-rule"></span>
</footer>
