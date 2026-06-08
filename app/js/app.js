// ── App entry point & top-level event handlers ────────────────────────────
// This file owns the handlers that are called directly from HTML attributes
// (onclick, oninput) that don't belong to a more specific module.

// Toggle a session's checked state
function toggle(dayKey, sessionId) {
  if (editMode) return; // clicks are disabled in edit mode
  const state = getState();
  const key   = `${dayKey}-${sessionId}`;
  state.checked[key] = !state.checked[key];
  saveState(state);
  render();
}

// Toggle a non-scheduled task checkbox
function toggleTask(taskId) {
  const state = getState();
  if (!state.tasks) state.tasks = {};
  state.tasks[taskId] = !state.tasks[taskId];
  saveState(state);
  render();
}

// Auto-save review textareas — debounced so it fires after typing stops
function autoSaveReview() {
  clearTimeout(_reviewTimer);
  _reviewTimer = setTimeout(() => {
    const state  = getState();
    state.review = {
      q1: document.getElementById('q1').value,
      q2: document.getElementById('q2').value,
      q3: document.getElementById('q3').value,
    };
    saveState(state);
    const flash = document.getElementById('savedFlash');
    flash.classList.add('show');
    setTimeout(() => flash.classList.remove('show'), 1500);
  }, 600);
}

// Confirm-dialog reset of the current week's checkmarks
function resetWeek() {
  if (!confirm('Reset all checkmarks for this week?')) return;
  saveState({ checked: {}, tasks: {}, review: { q1: '', q2: '', q3: '' } });
  render();
}

// Expand / collapse the weekly review panel and populate textareas from storage
function toggleReview() {
  const body = document.getElementById('reviewBody');
  const hint = document.getElementById('toggleHint');
  const open = body.classList.toggle('open');
  hint.textContent = open ? 'hide ↑' : 'show ↓';
  if (open) {
    const r = getState().review || {};
    document.getElementById('q1').value = r.q1 || '';
    document.getElementById('q2').value = r.q2 || '';
    document.getElementById('q3').value = r.q3 || '';
  }
}

// ── Dev utilities ──
function devReset() {
  if (!confirm('Delete ALL app data (schedule + all weeks)? This cannot be undone.')) return;
  Object.keys(localStorage)
    .filter(k => k === 'ls-schedule' || k === 'ls-tasks' || k.startsWith('ls-week-'))
    .forEach(k => localStorage.removeItem(k));
  taskFormOpen = false;
  render();
}

// ── Bootstrap ──
render();
