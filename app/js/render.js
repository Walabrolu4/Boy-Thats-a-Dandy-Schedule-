// ── Render ─────────────────────────────────────────────────────────────────
// Single render function that rebuilds the dynamic parts of the DOM from
// current schedule + week state. Called after any data mutation.
//
// Reads from: getState(), getSchedule(), getMVW(), getWeekRange()
//             editMode, activeAddDay, pendingType  (state.js)
//             TYPES, LEGEND_ITEMS                  (data.js)

function render() {
  const state      = getState();
  const days       = getSchedule();
  const todayJsDay = new Date().getDay();

  // Week range label
  document.getElementById('weekLabel').textContent = getWeekRange();

  // MVW chips
  document.getElementById('mvwChips').innerHTML = getMVW(state).map(item => {
    const cls = item.done ? 'chip done' : item.partial ? 'chip partial' : 'chip';
    return `<span class="${cls}">${item.done ? '✓ ' : ''}${item.label}</span>`;
  }).join('');

  // Week grid (7 day columns)
  document.getElementById('weekGrid').innerHTML = days.map(day => {
    const isToday = day.jsDay === todayJsDay;
    return `
      <div class="day-col${isToday ? ' today' : ''}" data-col="${day.key}"
        ondragover="onColDragOver(event,'${day.key}')"
        ondrop="onColDrop(event,'${day.key}')">
        <div class="day-header">
          ${day.label}${isToday ? '<span class="today-dot"></span>' : ''}
        </div>
        ${renderSessions(day, state)}
        ${renderAddArea(day.key)}
      </div>`;
  }).join('');

  // Non-scheduled tasks
  document.getElementById('tasksSection').innerHTML = renderTasks(state);

  // Legend
  document.getElementById('legend').innerHTML =
    LEGEND_ITEMS.map(l => `<span class="legend-item t-${l.type}">${l.label}</span>`).join('') +
    '<span style="font-size:10px;color:#bbb;padding:2px 0;align-self:center;">faded = micro session</span>';
}

// ── Helpers ──

function renderTasks(state) {
  const tasks  = getTasks();
  const checked = state.tasks || {};

  const rows = tasks.map(task => {
    const done     = !!checked[task.id];
    const checkCls = 'r-check' + (done ? ' done' : '');
    const delBtn   = editMode
      ? `<button class="task-del-btn" onclick="event.stopPropagation(); removeTask('${task.id}')" title="Remove">×</button>`
      : '';
    const clickAttr = editMode ? '' : `onclick="toggleTask('${task.id}')"`;
    return `<div class="task-row${editMode ? ' task-row-edit' : ''}" ${clickAttr}>
      <div class="${checkCls}">${done ? '✓' : ''}</div>
      <span class="reading-text">
        <strong>${task.label}</strong>${task.note ? ` — ${task.note}` : ''}
      </span>
      ${delBtn}
    </div>`;
  }).join('');

  let addArea = '';
  if (editMode) {
    if (taskFormOpen) {
      addArea = `<div class="task-add-form">
        <input type="text" id="new-task-label" placeholder="Task name"
          onkeydown="if(event.key==='Enter') confirmTaskAdd(); if(event.key==='Escape') cancelTaskForm()">
        <input type="text" id="new-task-note" placeholder="Description (optional)"
          onkeydown="if(event.key==='Enter') confirmTaskAdd(); if(event.key==='Escape') cancelTaskForm()">
        <div class="add-form-btns">
          <button class="add-confirm" onclick="confirmTaskAdd()">Add</button>
          <button class="add-cancel"  onclick="cancelTaskForm()">Cancel</button>
        </div>
      </div>`;
    } else {
      addArea = `<button class="add-task-btn" onclick="openTaskForm()">+ add task</button>`;
    }
  }

  return rows + addArea;
}

function renderSessions(day, state) {
  return day.sessions.map(s => {
    // Show inline edit form when this session is being edited
    if (editingSession && editingSession.dayKey === day.key && editingSession.sessionId === s.id) {
      return renderEditForm(day.key, s);
    }

    const key  = `${day.key}-${s.id}`;
    const done = !!state.checked[key];
    const cls  = [
      'session',
      `t-${s.type}`,
      s.micro   ? 'micro'     : '',
      done      ? 'done'      : '',
      !editMode ? 'checkable' : '',
    ].filter(Boolean).join(' ');

    const actionBtns = editMode
      ? `<span class="session-actions" draggable="false">
           <button class="edit-btn" draggable="false"
             onclick="event.stopPropagation(); openEditForm('${day.key}','${s.id}')"
             title="Edit">✎</button>
           <button class="del-btn" draggable="false"
             onclick="event.stopPropagation(); removeSession('${day.key}','${s.id}')"
             title="Remove">×</button>
         </span>`
      : `<span class="check">✓</span>`;

    const clickAttr = editMode ? '' : `onclick="toggle('${day.key}','${s.id}')"`;

    return `<div class="${cls}" draggable="true" data-session="${key}"
      ${clickAttr}
      ondragstart="onDragStart(event,'${day.key}','${s.id}')"
      ondragend="onDragEnd()"
      ondragover="onSessionDragOver(event,'${day.key}','${s.id}')"
      ondrop="onSessionDrop(event,'${day.key}','${s.id}')">
      ${s.label}<span class="note">${s.note || ''}</span>
      ${actionBtns}
    </div>`;
  }).join('');
}

function renderEditForm(dayKey, session) {
  const typePicker = TYPES.map(t =>
    `<span class="type-opt edit-type-opt t-${t}${editingType === t ? ' selected' : ''}"
       data-type="${t}"
       onclick="selectEditType('${t}')">${t}</span>`
  ).join('');

  return `<div class="add-form">
    <input type="text" id="edit-label-${session.id}" value="${session.label}"
      onkeydown="if(event.key==='Enter') saveEdit('${dayKey}','${session.id}'); if(event.key==='Escape') cancelEdit()">
    <div class="type-picker">${typePicker}</div>
    <input type="text" id="edit-note-${session.id}" value="${session.note || ''}" placeholder="Note (optional)"
      onkeydown="if(event.key==='Enter') saveEdit('${dayKey}','${session.id}'); if(event.key==='Escape') cancelEdit()">
    <button type="button" id="edit-micro-toggle" class="micro-toggle${editingMicro ? ' active' : ''}" onclick="toggleEditMicro()">micro</button>
    <div class="add-form-btns">
      <button class="add-confirm" onclick="saveEdit('${dayKey}','${session.id}')">Save</button>
      <button class="add-cancel"  onclick="cancelEdit()">Cancel</button>
    </div>
  </div>`;
}

function renderAddArea(dayKey) {
  if (!editMode) return '';

  if (activeAddDay === dayKey) {
    const typePicker = TYPES.map(t =>
      `<span class="type-opt t-${t}${pendingType === t ? ' selected' : ''}"
         data-type="${t}"
         onclick="selectType('${t}')">${t}</span>`
    ).join('');

    return `<div class="add-form">
      <input type="text" id="addname-${dayKey}" placeholder="Session name"
        onkeydown="if(event.key==='Enter') confirmAdd('${dayKey}'); if(event.key==='Escape') cancelAdd()">
      <div class="type-picker">${typePicker}</div>
      <input type="text" id="addnote-${dayKey}" placeholder="Note (optional)"
        onkeydown="if(event.key==='Enter') confirmAdd('${dayKey}'); if(event.key==='Escape') cancelAdd()">
      <button type="button" id="micro-toggle" class="micro-toggle${pendingMicro ? ' active' : ''}" onclick="togglePendingMicro()">micro</button>
      <div class="add-form-btns">
        <button class="add-confirm" onclick="confirmAdd('${dayKey}')">Add</button>
        <button class="add-cancel"  onclick="cancelAdd()">Cancel</button>
      </div>
    </div>`;
  }

  return `<button class="add-day-btn" onclick="openAddForm('${dayKey}')">+ add session</button>`;
}
