<script>
  import { onMount } from 'svelte';
  import { getSchedule, saveSchedule, getTagsSync } from '../lib/storage.js';

  let { weekState, editMode, scheduleVersion, onStateChange, onScheduleChange } = $props();

  let days = $derived.by(() => {
    scheduleVersion;
    return getSchedule();
  });

  let tags = $derived.by(() => {
    scheduleVersion;
    return getTagsSync();
  });

  let todayJsDay = new Date().getDay();
  let currentDayKey = $derived(days.find(d => d.jsDay === todayJsDay)?.key || 'mon');

  let activeAddDay = $state(null);
  let pendingTagId = $state('');
  let pendingMicro = $state(false);
  let editingSession = $state(null);
  let editingTagId = $state('');
  let editingMicro = $state(false);
  let dragState = $state(null);
  
  // ── Touch Reorder State ──
  let touchTimer = null;
  let reorderMode = $state(null);

  onMount(() => {
    const clickHandler = (e) => {
      if (reorderMode && !e.target.closest('.reorder-mode')) {
        reorderMode = null;
      }
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  function toggle(dayKey, sessionId) {
    if (editMode || reorderMode) return;
    const key = `${dayKey}-${sessionId}`;
    const newState = { ...weekState, checked: { ...weekState.checked } };
    newState.checked[key] = !newState.checked[key];
    onStateChange(newState);
  }

  function openAddForm(dayKey) {
    activeAddDay = dayKey; pendingTagId = tags[0]?.id || ''; pendingMicro = false;
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
      const session = { id: `custom-${Date.now()}`, label, tagId: pendingTagId, note: noteEl?.value.trim() ?? '' };
      if (pendingMicro) session.micro = true;
      d.sessions.push(session);
    }
    saveSchedule(allDays);
    activeAddDay = null; pendingTagId = ''; pendingMicro = false;
    onScheduleChange();
  }

  function removeSession(dayKey, sessionId) {
    const allDays = getSchedule();
    const d = allDays.find(d => d.key === dayKey);
    if (d) d.sessions = d.sessions.filter(s => s.id !== sessionId);
    saveSchedule(allDays); onScheduleChange();
  }

  function openEditForm(dayKey, sessionId) {
    const d = getSchedule().find(d => d.key === dayKey);
    const session = d?.sessions.find(s => s.id === sessionId);
    if (!session) return;
    editingSession = { dayKey, sessionId };
    editingTagId = session.tagId; editingMicro = !!session.micro;
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
    session.label = label; session.tagId = editingTagId; session.note = noteEl?.value.trim() ?? '';
    if (editingMicro) session.micro = true; else delete session.micro;
    saveSchedule(allDays);
    editingSession = null; onScheduleChange();
  }

  // ── Touch Reorder Logic ──
  function onTouchStart(e, dayKey, sessionId) {
    if (editMode) return;
    touchTimer = setTimeout(() => {
      reorderMode = { dayKey, sessionId };
    }, 500);
  }
  function onTouchEndOrMove() {
    if (touchTimer) clearTimeout(touchTimer);
  }
  function moveReorder(dir) {
    if (!reorderMode) return;
    const { dayKey, sessionId } = reorderMode;
    const allDays = getSchedule();
    const d = allDays.find(d => d.key === dayKey);
    const idx = d.sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return;
    if (dir === -1 && idx > 0) {
      const temp = d.sessions[idx]; d.sessions[idx] = d.sessions[idx - 1]; d.sessions[idx - 1] = temp;
    } else if (dir === 1 && idx < d.sessions.length - 1) {
      const temp = d.sessions[idx]; d.sessions[idx] = d.sessions[idx + 1]; d.sessions[idx + 1] = temp;
    } else return;
    saveSchedule(allDays); onScheduleChange();
  }
  function moveToDay(e) {
    const toDay = e.target.value;
    if (!reorderMode || !toDay) return;
    const { dayKey, sessionId } = reorderMode;
    if (dayKey === toDay) return;
    dragState = { fromDay: dayKey, sessionId };
    performMove(toDay, null, 'end');
    reorderMode = { dayKey: toDay, sessionId };
  }

  // ── Drag and drop ──
  function onDragStart(e, dayKey, sessionId) {
    dragState = { fromDay: dayKey, sessionId, el: e.currentTarget };
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', '');
    requestAnimationFrame(() => dragState?.el?.classList.add('dragging'));
  }
  function onDragEnd() { dragState?.el?.classList.remove('dragging'); dragState = null; clearDropUI(); }
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
    saveSchedule(allDays); dragState = null; onScheduleChange();
  }

  function scrollToDay(key) {
    const el = document.querySelector(`[data-col="${key}"]`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 70; // offset for sticky tab bar
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
</script>

<div class="mobile-tabs">
  <button class="tab-chip {currentDayKey === 'today' ? 'active' : ''}" onclick={() => scrollToDay(currentDayKey)}>Today</button>
  {#each days as day}
    <button class="tab-chip" onclick={() => scrollToDay(day.key)}>{day.label.slice(0, 3)}</button>
  {/each}
</div>

<div class="section-heading">Scheduled</div>
<div class="week-grid" id="weekGrid">
  {#each days as day}
    {@const isToday = day.jsDay === todayJsDay}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="day-col {isToday ? 'today' : ''} {day.sessions.length === 0 && !editMode ? 'empty' : ''}" data-col={day.key}
      ondragover={e => onColDragOver(e, day.key)}
      ondrop={e => onColDrop(e, day.key)}>

      <div class="day-header" onclick={() => { if(day.sessions.length === 0 && !editMode) toggleEditMode?.(); }}>
        {day.label}{#if isToday}<span class="today-dot"></span>{/if}
      </div>

      {#each day.sessions as session}
        {@const isReorder = reorderMode?.dayKey === day.key && reorderMode?.sessionId === session.id}
        {@const tag = tags.find(t => t.id === session.tagId)}
        {#if editingSession?.dayKey === day.key && editingSession?.sessionId === session.id}
          <div class="add-form">
            <input type="text" id="edit-label-{session.id}" value={session.label}
              onkeydown={e => { if (e.key==='Enter') saveEdit(day.key,session.id); if (e.key==='Escape') cancelEdit(); }}>
            <div class="type-picker">
              {#each tags as t}
                <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
                <span class="type-opt edit-type-opt {editingTagId===t.id?'selected':''}"
                  style="color: {t.color}; border-color: {t.color}; background: {editingTagId===t.id ? t.color+'40' : 'transparent'}"
                  onclick={() => { editingTagId = t.id; }}>{t.label}</span>
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
          <div class="session {session.micro?'micro':''} {done?'done':''} {!editMode?'checkable':''} {isReorder?'reorder-mode':''}"
            style="{tag ? `color: ${tag.color}; border-color: ${done ? tag.color : tag.color+'40'}; background: ${done ? tag.color+'22' : 'transparent'}` : ''}"
            draggable="true" data-session={key}
            onclick={() => toggle(day.key, session.id)}
            ontouchstart={e => onTouchStart(e, day.key, session.id)}
            ontouchend={onTouchEndOrMove}
            ontouchmove={onTouchEndOrMove}
            ontouchcancel={onTouchEndOrMove}
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
            {:else if !isReorder}
              <span class="check">✓</span>
            {/if}
            {#if isReorder}
              <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="reorder-actions" onclick={e => e.stopPropagation()}>
                <button class="reorder-btn" onclick={() => moveReorder(-1)}>↑</button>
                <button class="reorder-btn" onclick={() => moveReorder(1)}>↓</button>
                <select class="reorder-select" onchange={moveToDay}>
                  <option value="" disabled selected>Move to...</option>
                  {#each days as d}
                    <option value={d.key} disabled={d.key === day.key}>{d.label}</option>
                  {/each}
                </select>
              </div>
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
              {#each tags as t}
                <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
                <span class="type-opt {pendingTagId===t.id?'selected':''}"
                  style="color: {t.color}; border-color: {t.color}; background: {pendingTagId===t.id ? t.color+'40' : 'transparent'}"
                  onclick={() => { pendingTagId = t.id; }}>{t.label}</span>
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
  {#each tags as t}
    <span class="legend-item" style="color: {t.color}">{t.label}</span>
  {/each}
  <span style="font-size:10px;color:#bbb;padding:2px 0;align-self:center;">faded = micro session</span>
</div>
