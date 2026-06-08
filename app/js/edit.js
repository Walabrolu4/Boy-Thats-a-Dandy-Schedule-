// ── Edit mode: add / remove sessions ──────────────────────────────────────
// Edit mode is toggled via the "Edit schedule" button in the header.
// In edit mode: × buttons appear on sessions, and each day gets an add form.
// Normal click-to-check behaviour is disabled while edit mode is active.

function toggleEditMode() {
  editMode = !editMode;
  if (!editMode) {
    activeAddDay   = null;
    pendingType    = 'anchor';
    pendingMicro   = false;
    taskFormOpen   = false;
    editingSession = null;
  }
  document.getElementById('editBtn').classList.toggle('active', editMode);
  render();
}

function removeSession(dayKey, sessionId) {
  const days = getSchedule();
  const day  = days.find(d => d.key === dayKey);
  if (day) day.sessions = day.sessions.filter(s => s.id !== sessionId);
  saveSchedule(days);
  render();
}

function openAddForm(dayKey) {
  activeAddDay = dayKey;
  pendingType  = 'anchor';
  pendingMicro = false;
  render();
  // Focus the name input after render
  setTimeout(() => {
    const el = document.getElementById(`addname-${dayKey}`);
    if (el) el.focus();
  }, 30);
}

function cancelAdd() {
  activeAddDay = null;
  pendingMicro = false;
  render();
}

// Micro toggle for the ADD form — direct DOM update to preserve typed input values
function togglePendingMicro() {
  pendingMicro = !pendingMicro;
  const el = document.getElementById('micro-toggle');
  if (el) el.classList.toggle('active', pendingMicro);
}

// ── Edit existing session ──

function openEditForm(dayKey, sessionId) {
  const days    = getSchedule();
  const day     = days.find(d => d.key === dayKey);
  const session = day && day.sessions.find(s => s.id === sessionId);
  if (!session) return;
  editingSession = { dayKey, sessionId };
  editingType    = session.type;
  editingMicro   = !!session.micro;
  activeAddDay   = null; // close any open add form
  render();
  setTimeout(() => {
    const el = document.getElementById(`edit-label-${sessionId}`);
    if (el) { el.focus(); el.select(); }
  }, 30);
}

function cancelEdit() {
  editingSession = null;
  render();
}

// Type picker for the EDIT form — direct DOM update to preserve typed input values
function selectEditType(type) {
  editingType = type;
  document.querySelectorAll('.edit-type-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.type === type);
  });
}

// Micro toggle for the EDIT form — same pattern as add form
function toggleEditMicro() {
  editingMicro = !editingMicro;
  const el = document.getElementById('edit-micro-toggle');
  if (el) el.classList.toggle('active', editingMicro);
}

function saveEdit(dayKey, sessionId) {
  const labelEl = document.getElementById(`edit-label-${sessionId}`);
  const noteEl  = document.getElementById(`edit-note-${sessionId}`);
  const label   = labelEl ? labelEl.value.trim() : '';
  if (!label) { if (labelEl) labelEl.focus(); return; }

  const days    = getSchedule();
  const day     = days.find(d => d.key === dayKey);
  const session = day && day.sessions.find(s => s.id === sessionId);
  if (!session) return;

  session.label = label;
  session.type  = editingType;
  session.note  = noteEl ? noteEl.value.trim() : '';
  if (editingMicro) session.micro = true;
  else delete session.micro;

  saveSchedule(days);
  editingSession = null;
  render();
}

// Called when a type chip is clicked in the add form.
// Updates the visual selection without a full re-render so typed text is preserved.
function selectType(type) {
  pendingType = type;
  document.querySelectorAll('.type-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.type === type);
  });
}

// ── Non-scheduled task management ──

function openTaskForm() {
  taskFormOpen = true;
  render();
  setTimeout(() => {
    const el = document.getElementById('new-task-label');
    if (el) el.focus();
  }, 30);
}

function cancelTaskForm() {
  taskFormOpen = false;
  render();
}

function confirmTaskAdd() {
  const labelEl = document.getElementById('new-task-label');
  const noteEl  = document.getElementById('new-task-note');
  const label   = labelEl ? labelEl.value.trim() : '';
  if (!label) { if (labelEl) labelEl.focus(); return; }
  const tasks = getTasks();
  tasks.push({ id: `task-${Date.now()}`, label, note: noteEl ? noteEl.value.trim() : '' });
  saveTasks(tasks);
  taskFormOpen = false;
  render();
}

function removeTask(taskId) {
  const tasks = getTasks().filter(t => t.id !== taskId);
  saveTasks(tasks);
  // Also clear its checked state for this week
  const state = getState();
  if (state.tasks) delete state.tasks[taskId];
  saveState(state);
  render();
}

function confirmAdd(dayKey) {
  const nameEl = document.getElementById(`addname-${dayKey}`);
  const noteEl = document.getElementById(`addnote-${dayKey}`);
  const label  = nameEl ? nameEl.value.trim() : '';
  if (!label) { if (nameEl) nameEl.focus(); return; }

  const days = getSchedule();
  const day  = days.find(d => d.key === dayKey);
  if (day) {
    const session = {
      id:    `custom-${Date.now()}`,
      label,
      type:  pendingType,
      note:  noteEl ? noteEl.value.trim() : '',
    };
    if (pendingMicro) session.micro = true;
    day.sessions.push(session);
  }

  saveSchedule(days);
  activeAddDay = null;
  pendingType  = 'anchor';
  pendingMicro = false;
  render();
}
