<script>
  import { TYPES, LEGEND_ITEMS } from '../lib/data.js';
  import { getSchedule, saveSchedule } from '../lib/storage.js';

  export let weekState;
  export let editMode;
  export let onStateChange; // callback to trigger re-render in App

  // Local UI state for add/edit forms
  let activeAddDay = null;
  let pendingType = 'anchor';
  let pendingMicro = false;
  let editingSession = null; // { dayKey, sessionId }
  let editingType = 'anchor';
  let editingMicro = false;

  // Drag state
  let dragState = null;

  $: days = getSchedule();
  $: todayJsDay = new Date().getDay();

  // Refresh local days when parent signals a data change
  export function refresh() {
    days = getSchedule();
  }

  // ── Check / toggle session ──
  function toggle(dayKey, sessionId) {
    if (editMode) return;
    const key = `${dayKey}-${sessionId}`;
    weekState.checked[key] = !weekState.checked[key];
    onStateChange(weekState);
  }

  // ── Edit mode: add/remove/edit sessions ──

  function openAddForm(dayKey) {
    activeAddDay = dayKey;
    pendingType = 'anchor';
    pendingMicro = false;
    setTimeout(() => {
      const el = document.getElementById(`addname-${dayKey}`);
      if (el) el.focus();
    }, 30);
  }

  function cancelAdd() {
    activeAddDay = null;
    pendingMicro = false;
  }

  function confirmAdd(dayKey) {
    const nameEl = document.getElementById(`addname-${dayKey}`);
    const noteEl = document.getElementById(`addnote-${dayKey}`);
    const label = nameEl ? nameEl.value.trim() : '';
    if (!label) { if (nameEl) nameEl.focus(); return; }
    const d = days.find(d => d.key === dayKey);
    if (d) {
      const session = { id: `custom-${Date.now()}`, label, type: pendingType, note: noteEl ? noteEl.value.trim() : '' };
      if (pendingMicro) session.micro = true;
      d.sessions.push(session);
    }
    saveSchedule(days);
    days = getSchedule();
    activeAddDay = null;
    pendingType = 'anchor';
    pendingMicro = false;
  }

  function removeSession(dayKey, sessionId) {
    const d = days.find(d => d.key === dayKey);
    if (d) d.sessions = d.sessions.filter(s => s.id !== sessionId);
    saveSchedule(days);
    days = getSchedule();
  }

  function openEditForm(dayKey, sessionId) {
    const d = days.find(d => d.key === dayKey);
    const session = d && d.sessions.find(s => s.id === sessionId);
    if (!session) return;
    editingSession = { dayKey, sessionId };
    editingType = session.type;
    editingMicro = !!session.micro;
    activeAddDay = null;
    setTimeout(() => {
      const el = document.getElementById(`edit-label-${sessionId}`);
      if (el) { el.focus(); el.select(); }
    }, 30);
  }

  function cancelEdit() {
    editingSession = null;
  }

  function saveEdit(dayKey, sessionId) {
    const labelEl = document.getElementById(`edit-label-${sessionId}`);
    const noteEl = document.getElementById(`edit-note-${sessionId}`);
    const label = labelEl ? labelEl.value.trim() : '';
    if (!label) { if (labelEl) labelEl.focus(); return; }
    const d = days.find(d => d.key === dayKey);
    const session = d && d.sessions.find(s => s.id === sessionId);
    if (!session) return;
    session.label = label;
    session.type = editingType;
    session.note = noteEl ? noteEl.value.trim() : '';
    if (editingMicro) session.micro = true;
    else delete session.micro;
    saveSchedule(days);
    days = getSchedule();
    editingSession = null;
  }

  // ── Drag and drop ──

  function onDragStart(e, dayKey, sessionId) {
    dragState = { fromDay: dayKey, sessionId, el: e.currentTarget };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
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
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
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
    const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    clearDropUI();
    performMove(dayKey, sessionId, pos);
  }

  function onColDrop(e, dayKey) {
    e.preventDefault();
    if (!dragState) return;
    clearDropUI();
    performMove(dayKey, null, 'end');
  }

  function clearDropUI() {
    document.querySelectorAll('.drop-before, .drop-after, .drop-col').forEach(el => {
      el.classList.remove('drop-before', 'drop-after', 'drop-col');
    });
  }

  function performMove(toDay, targetSessionId, pos) {
    if (!dragState) return;
    const { fromDay, sessionId: fromId } = dragState;
    const fromDayObj = days.find(d => d.key === fromDay);
    const toDayObj = days.find(d => d.key === toDay);
    if (!fromDayObj || !toDayObj) return;
    const session = fromDayObj.sessions.find(s => s.id === fromId);
    if (!session) return;
    fromDayObj.sessions = fromDayObj.sessions.filter(s => s.id !== fromId);
    if (!targetSessionId || pos === 'end') {
      toDayObj.sessions.push(session);
    } else {
      let idx = toDayObj.sessions.findIndex(s => s.id === targetSessionId);
      if (idx === -1) toDayObj.sessions.push(session);
      else {
        if (pos === 'after') idx++;
        toDayObj.sessions.splice(idx, 0, session);
      }
    }
    saveSchedule(days);
    days = getSchedule();
    dragState = null;
  }
</script>

<div class="section-heading">Scheduled</div>
<div class="week-grid" id="weekGrid">
  {#each days as day}
    {@const isToday = day.jsDay === todayJsDay}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="day-col {isToday ? 'today' : ''}"
      data-col={day.key}
      on:dragover={e => onColDragOver(e, day.key)}
      on:drop={e => onColDrop(e, day.key)}
    >
      <div class="day-header">
        {day.label}{#if isToday}<span class="today-dot"></span>{/if}
      </div>

      {#each day.sessions as session}
        {#if editingSession && editingSession.dayKey === day.key && editingSession.sessionId === session.id}
          <!-- Inline edit form -->
          <div class="add-form">
            <input type="text" id="edit-label-{session.id}" value={session.label}
              on:keydown={e => { if (e.key === 'Enter') saveEdit(day.key, session.id); if (e.key === 'Escape') cancelEdit(); }}>
            <div class="type-picker">
              {#each TYPES as t}
                <span
                  class="type-opt edit-type-opt t-{t} {editingType === t ? 'selected' : ''}"
                  on:click={() => { editingType = t; }}
                >{t}</span>
              {/each}
            </div>
            <input type="text" id="edit-note-{session.id}" value={session.note || ''} placeholder="Note (optional)"
              on:keydown={e => { if (e.key === 'Enter') saveEdit(day.key, session.id); if (e.key === 'Escape') cancelEdit(); }}>
            <button type="button" class="micro-toggle {editingMicro ? 'active' : ''}"
              on:click={() => { editingMicro = !editingMicro; }}>micro</button>
            <div class="add-form-btns">
              <button class="add-confirm" on:click={() => saveEdit(day.key, session.id)}>Save</button>
              <button class="add-cancel" on:click={cancelEdit}>Cancel</button>
            </div>
          </div>
        {:else}
          {@const key = `${day.key}-${session.id}`}
          {@const done = !!weekState.checked[key]}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="session t-{session.type} {session.micro ? 'micro' : ''} {done ? 'done' : ''} {!editMode ? 'checkable' : ''}"
            draggable="true"
            data-session={key}
            on:click={() => toggle(day.key, session.id)}
            on:dragstart={e => onDragStart(e, day.key, session.id)}
            on:dragend={onDragEnd}
            on:dragover={e => onSessionDragOver(e, day.key, session.id)}
            on:drop={e => onSessionDrop(e, day.key, session.id)}
          >
            {session.label}<span class="note">{session.note || ''}</span>
            {#if editMode}
              <span class="session-actions" draggable="false">
                <button class="edit-btn" draggable="false"
                  on:click|stopPropagation={() => openEditForm(day.key, session.id)}
                  title="Edit">✎</button>
                <button class="del-btn" draggable="false"
                  on:click|stopPropagation={() => removeSession(day.key, session.id)}
                  title="Remove">×</button>
              </span>
            {:else}
              <span class="check">✓</span>
            {/if}
          </div>
        {/if}
      {/each}

      {#if editMode}
        {#if activeAddDay === day.key}
          <div class="add-form">
            <input type="text" id="addname-{day.key}" placeholder="Session name"
              on:keydown={e => { if (e.key === 'Enter') confirmAdd(day.key); if (e.key === 'Escape') cancelAdd(); }}>
            <div class="type-picker">
              {#each TYPES as t}
                <span
                  class="type-opt t-{t} {pendingType === t ? 'selected' : ''}"
                  on:click={() => { pendingType = t; }}
                >{t}</span>
              {/each}
            </div>
            <input type="text" id="addnote-{day.key}" placeholder="Note (optional)"
              on:keydown={e => { if (e.key === 'Enter') confirmAdd(day.key); if (e.key === 'Escape') cancelAdd(); }}>
            <button type="button" class="micro-toggle {pendingMicro ? 'active' : ''}"
              on:click={() => { pendingMicro = !pendingMicro; }}>micro</button>
            <div class="add-form-btns">
              <button class="add-confirm" on:click={() => confirmAdd(day.key)}>Add</button>
              <button class="add-cancel" on:click={cancelAdd}>Cancel</button>
            </div>
          </div>
        {:else}
          <button class="add-day-btn" on:click={() => openAddForm(day.key)}>+ add session</button>
        {/if}
      {/if}
    </div>
  {/each}
</div>

<div class="legend" id="legend">
  {#each LEGEND_ITEMS as l}
    <span class="legend-item t-{l.type}">{l.label}</span>
  {/each}
  <span style="font-size:10px;color:#bbb;padding:2px 0;align-self:center;">faded = micro session</span>
</div>
