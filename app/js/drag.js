// ── Drag-and-drop handlers ─────────────────────────────────────────────────
// Sessions are draggable at all times (not just in edit mode).
// Dropping on a session inserts before/after based on mouse Y position.
// Dropping on an empty column area appends to the end.
// All changes are saved to localStorage and trigger a re-render.

function onDragStart(e, dayKey, sessionId) {
  dragState = { fromDay: dayKey, sessionId, el: e.currentTarget };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', ''); // required for Firefox
  // Defer adding the class so the drag image captures the un-faded element
  requestAnimationFrame(() => {
    if (dragState && dragState.el) dragState.el.classList.add('dragging');
  });
}

function onDragEnd() {
  if (dragState && dragState.el) dragState.el.classList.remove('dragging');
  dragState = null;
  clearDropUI();
}

function onSessionDragOver(e, dayKey, sessionId) {
  if (!dragState) return;
  e.preventDefault();
  e.stopPropagation(); // prevent column handler from also firing
  const rect = e.currentTarget.getBoundingClientRect();
  const pos  = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
  clearDropUI();
  e.currentTarget.classList.add(pos === 'before' ? 'drop-before' : 'drop-after');
  const col = document.querySelector(`[data-col="${dayKey}"]`);
  if (col) col.classList.add('drop-col');
}

function onColDragOver(e, dayKey) {
  if (!dragState) return;
  e.preventDefault();
  clearDropUI();
  const col = document.querySelector(`[data-col="${dayKey}"]`);
  if (col) col.classList.add('drop-col');
}

function onSessionDrop(e, dayKey, sessionId) {
  e.preventDefault();
  e.stopPropagation();
  if (!dragState) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pos  = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
  clearDropUI();
  performMove(dayKey, sessionId, pos);
}

function onColDrop(e, dayKey) {
  e.preventDefault();
  if (!dragState) return;
  clearDropUI();
  performMove(dayKey, null, 'end');
}

// Remove all drop-indicator classes from the DOM
function clearDropUI() {
  document.querySelectorAll('.drop-before, .drop-after, .drop-col').forEach(el => {
    el.classList.remove('drop-before', 'drop-after', 'drop-col');
  });
}

// Move the dragged session to its new position and persist
function performMove(toDay, targetSessionId, pos) {
  if (!dragState) return;
  const { fromDay, sessionId: fromId } = dragState;

  const days       = getSchedule();
  const fromDayObj = days.find(d => d.key === fromDay);
  const toDayObj   = days.find(d => d.key === toDay);
  if (!fromDayObj || !toDayObj) return;

  const session = fromDayObj.sessions.find(s => s.id === fromId);
  if (!session) return;

  // Remove from source
  fromDayObj.sessions = fromDayObj.sessions.filter(s => s.id !== fromId);

  // Insert at target
  if (!targetSessionId || pos === 'end') {
    toDayObj.sessions.push(session);
  } else {
    let idx = toDayObj.sessions.findIndex(s => s.id === targetSessionId);
    if (idx === -1) {
      toDayObj.sessions.push(session);
    } else {
      if (pos === 'after') idx++;
      toDayObj.sessions.splice(idx, 0, session);
    }
  }

  saveSchedule(days);
  dragState = null;
  render();
}
