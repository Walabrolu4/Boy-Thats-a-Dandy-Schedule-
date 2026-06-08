<script>
  import { TYPES, LEGEND_ITEMS } from '../lib/data.js';
  import { getSchedule, saveSchedule } from '../lib/storage.js';

  let { weekState, editMode, scheduleVersion, onStateChange, onScheduleChange } = $props();

  // Re-read schedule from localStorage whenever scheduleVersion changes
  let days = $derived.by(() => {
    scheduleVersion; // track the dependency
    return getSchedule();
  });

  let todayJsDay = new Date().getDay();

  // Local form state
  let activeAddDay = $state(null);
  let pendingType = $state('anchor');
  let pendingMicro = $state(false);
  let editingSession = $state(null);
  let editingType = $state('anchor');
  let editingMicro = $state(false);
  let dragState = $state(null);

  function toggle(dayKey, sessionId) {
    if (editMode) return;
    const key = `${dayKey}-${sessionId}`;
    const newState = { ...weekState, checked: { ...weekState.checked } };
    newState.checked[key] = !newState.checked[key];
    onStateChange(newState);
  }

  function openAddForm(dayKey) {
    activeAddDay = dayKey;
    pendingType = 'anchor';
    pendingMicro = false;
    setTimeout(() => document.getElementById(`addname-${dayKey}`)?.focus(), 30);
  }

  function cancelAdd() { activeAddDay = null; pendingMicro = false; }

  function confirmAdd(dayKey) {
    const nameEl = document.getElementById(`addname-${dayKey}`);
    const noteEl = document.getElementById(`addnote-${dayKey}`);
    const label = nameEl?.value.trim() ?? '';
    if (!label) { nameEl?.focus(); return; }
    const allDays = getSchedule();
    const d = allDays.find(d => d.key === dayKey);
    if (d) {
      const session = { id: `custom-${Date.now()}`, label, type: pendingType, note: noteEl?.value.trim() ?? '' };
      if (pendingMicro) session.micro = true;
      d.sessions.push(session);
    }
    saveSchedule(allDays);
    activeAddDay = null; pendingType = 'anchor'; pendingMicro = false;
    onScheduleChange();
  }

  function removeSession(dayKey, sessionId) {
    const allDays = getSchedule();
    const d = allDays.find(d => d.key === dayKey);
    if (d) d.sessions = d.sessions.filter(s => s.id !== sessionId);
    saveSchedule(allDays);
    onScheduleChange();
  }

  function openEditForm(dayKey, sessionId) {
    const d = getSchedule().find(d => d.key === dayKey);
    const session = d?.sessions.find(s => s.id === sessionId);
    if (!session) return;
    editingSession = { dayKey, sessionId };
    editingType = session.type;
    editingMicro = !!session.micro;
    activeAddDay = null;
    setTimeout(() => { const el = document.getElementById(`edit-label-${sessionId}`); el?.focus(); el?.select(); }, 30);
  }

  function cancelEdit() { editingSession = null; }

  function saveEdit(dayKey, sessionId) {
    const labelEl = document.getElementById(`edit-label-${sessionId}`);
    const noteEl = document.getElementById(`edit-note-${sessionId}`);
    const label = labelEl?.value.trim() ?? '';
    if (!label) { labelEl?.focus(); return; }
    const allDays = getSchedule();
    const session = allDays.find(d => d.key === dayKey)?.sessions.find(s => s.id === sessionId);
    if (!session) return;
    session.label = label; session.type = editingType; session.note = noteEl?.value.trim() ?? '';
    if (editingMicro) session.micro = true; else delete session.micro;
    saveSchedule(allDays);
    editingSession = null;
    onScheduleChange();
  }

  // ── Drag and drop ──
  function onDragStart(e, dayKey, sessionId) {
    dragState = { fromDay: dayKey, sessionId, el: e.currentTarget };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    requestAnimationFrame(() => dragState?.el?.classList.add('dragging'));
  }

  function onDragEnd() {
    dragState?.el?.classList.remove('dragging');
    dragState = null;
    clearDropUI();
  }

  function onSessionDragOver(e, dayKey, sessionId) {
    if (!dragState) return;
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    clearDropUI();
    e.currentTarget.classList.add(pos === 'before' ? 'drop-before' : 'drop-after');
    document.querySelector(`[data-col="${dayKey}"]`)?.classList.add('drop-col');
  }

  function onColDragOver(e, dayKey) {
    if (!dragState) return;
    e.preventDefault(); clearDropUI();
    document.querySelector(`[data-col="${dayKey}"]`)?.classList.add('drop-col');
  }

  function onSessionDrop(e, dayKey, sessionId) {
    e.preventDefault(); e.stopPropagation();
    if (!dragState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    clearDropUI(); performMove(dayKey, sessionId, pos);
  }

  function onColDrop(e, dayKey) {
    e.preventDefault();
    if (!dragState) return;
    clearDropUI(); performMove(dayKey, null, 'end');
  }

  function clearDropUI() {
    document.querySelectorAll('.drop-before,.drop-after,.drop-col').forEach(el =>
      el.classList.remove('drop-before', 'drop-after', 'drop-col'));
  }

  function performMove(toDay, targetSessionId, pos) {
    if (!dragState) return;
    const { fromDay, sessionId: fromId } = dragState;
    const allDays = getSchedule();
    const fromDayObj = allDays.find(d => d.key === fromDay);
    const toDayObj = allDays.find(d => d.key === toDay);
    if (!fromDayObj || !toDayObj) return;
    const session = fromDayObj.sessions.find(s => s.id === fromId);
    if (!session) return;
    fromDayObj.sessions = fromDayObj.sessions.filter(s => s.id !== fromId);
    if (!targetSessionId || pos === 'end') {
      toDayObj.sessions.push(session);
    } else {
      let idx = toDayObj.sessions.findIndex(s => s.id === targetSessionId);
      if (idx === -1) toDayObj.sessions.push(session);
      else { if (pos === 'after') idx++; toDayObj.sessions.splice(idx, 0, session); }
    }
    saveSchedule(allDays);
    dragState = null;
    onScheduleChange();
  }
</script>

<div class="section-heading">Scheduled</div>
<div class="week-grid" id="weekGrid">
  {#each days as day}
    {@const isToday = day.jsDay === todayJsDay}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="day-col {isToday ? 'today' : ''}" data-col={day.key}
      ondragover={e => onColDragOver(e, day.key)}
      ondrop={e => onColDrop(e, day.key)}>

      <div class="day-header">
        {day.label}{#if isToday}<span class="today-dot"></span>{/if}
      </div>

      {#each day.sessions as session}
        {#if editingSession?.dayKey === day.key && editingSession?.sessionId === session.id}
          <div class="add-form">
            <input type="text" id="edit-label-{session.id}" value={session.label}
              onkeydown={e => { if (e.key==='Enter') saveEdit(day.key,session.id); if (e.key==='Escape') cancelEdit(); }}>
            <div class="type-picker">
              {#each TYPES as t}
                <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
                <span class="type-opt edit-type-opt t-{t} {editingType===t?'selected':''}"
                  onclick={() => { editingType = t; }}>{t}</span>
              {/each}
            </div>
            <input type="text" id="edit-note-{session.id}" value={session.note||''} placeholder="Note (optional)"
              onkeydown={e => { if (e.key==='Enter') saveEdit(day.key,session.id); if (e.key==='Escape') cancelEdit(); }}>
            <button type="button" class="micro-toggle {editingMicro?'active':''}"
              onclick={() => { editingMicro = !editingMicro; }}>micro</button>
            <div class="add-form-btns">
              <button class="add-confirm" onclick={() => saveEdit(day.key,session.id)}>Save</button>
              <button class="add-cancel" onclick={cancelEdit}>Cancel</button>
            </div>
          </div>
        {:else}
          {@const key = `${day.key}-${session.id}`}
          {@const done = !!weekState.checked[key]}
          <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="session t-{session.type} {session.micro?'micro':''} {done?'done':''} {!editMode?'checkable':''}"
            draggable="true" data-session={key}
            onclick={() => toggle(day.key, session.id)}
            ondragstart={e => onDragStart(e, day.key, session.id)}
            ondragend={onDragEnd}
            ondragover={e => onSessionDragOver(e, day.key, session.id)}
            ondrop={e => onSessionDrop(e, day.key, session.id)}>
            {session.label}<span class="note">{session.note||''}</span>
            {#if editMode}
              <span class="session-actions" draggable="false">
                <button class="edit-btn" draggable="false"
                  onclick={e => { e.stopPropagation(); openEditForm(day.key,session.id); }} title="Edit">✎</button>
                <button class="del-btn" draggable="false"
                  onclick={e => { e.stopPropagation(); removeSession(day.key,session.id); }} title="Remove">×</button>
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
              onkeydown={e => { if (e.key==='Enter') confirmAdd(day.key); if (e.key==='Escape') cancelAdd(); }}>
            <div class="type-picker">
              {#each TYPES as t}
                <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
                <span class="type-opt t-{t} {pendingType===t?'selected':''}"
                  onclick={() => { pendingType = t; }}>{t}</span>
              {/each}
            </div>
            <input type="text" id="addnote-{day.key}" placeholder="Note (optional)"
              onkeydown={e => { if (e.key==='Enter') confirmAdd(day.key); if (e.key==='Escape') cancelAdd(); }}>
            <button type="button" class="micro-toggle {pendingMicro?'active':''}"
              onclick={() => { pendingMicro = !pendingMicro; }}>micro</button>
            <div class="add-form-btns">
              <button class="add-confirm" onclick={() => confirmAdd(day.key)}>Add</button>
              <button class="add-cancel" onclick={cancelAdd}>Cancel</button>
            </div>
          </div>
        {:else}
          <button class="add-day-btn" onclick={() => openAddForm(day.key)}>+ add session</button>
        {/if}
      {/if}
    </div>
  {/each}
</div>

<div class="legend">
  {#each LEGEND_ITEMS as l}
    <span class="legend-item t-{l.type}">{l.label}</span>
  {/each}
  <span style="font-size:10px;color:#bbb;padding:2px 0;align-self:center;">faded = micro session</span>
</div>
