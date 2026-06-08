<script>
  import { getTasks, saveTasks, getTagsSync } from '../lib/storage.js';

  let { weekState, editMode, scheduleVersion, onStateChange, onScheduleChange } = $props();

  let tasks = $derived.by(() => {
    scheduleVersion; // track dependency
    return getTasks();
  });

  let tags = $derived.by(() => {
    scheduleVersion;
    return getTagsSync();
  });

  let taskFormOpen = $state(false);
  let pendingTagId = $state('');

  function toggleTask(taskId) {
    if (editMode) return;
    const newState = { ...weekState, tasks: { ...weekState.tasks } };
    newState.tasks[taskId] = !newState.tasks[taskId];
    onStateChange(newState);
  }

  function openTaskForm() {
    taskFormOpen = true;
    pendingTagId = ''; // untagged by default
    setTimeout(() => document.getElementById('new-task-label')?.focus(), 30);
  }

  function cancelTaskForm() { taskFormOpen = false; }

  function confirmTaskAdd() {
    const labelEl = document.getElementById('new-task-label');
    const noteEl = document.getElementById('new-task-note');
    const label = labelEl?.value.trim() ?? '';
    if (!label) { labelEl?.focus(); return; }
    const allTasks = getTasks();
    const newTask = { id: `task-${Date.now()}`, label, note: noteEl?.value.trim() ?? '' };
    if (pendingTagId) newTask.tagId = pendingTagId;
    allTasks.push(newTask);
    saveTasks(allTasks);
    taskFormOpen = false;
    onScheduleChange();
  }

  function removeTask(taskId) {
    saveTasks(getTasks().filter(t => t.id !== taskId));
    const newState = { ...weekState, tasks: { ...weekState.tasks } };
    delete newState.tasks[taskId];
    onStateChange(newState);
    onScheduleChange();
  }
</script>

<div class="section-heading">Unscheduled</div>
<div id="tasksSection">
  {#each tasks as task}
    {@const done = !!(weekState.tasks?.[task.id])}
    {@const tag = tags.find(t => t.id === task.tagId)}
    <!-- svelte-ignore a11y_no_static_element_interactions --><!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="task-row {editMode?'task-row-edit':''}"
      onclick={() => { if (!editMode) toggleTask(task.id); }}>
      <div class="r-check {done?'done':''}" style="{tag && done ? `background:${tag.color}; border-color:${tag.color};` : tag ? `border-color:${tag.color}80` : ''}">{done ? '✓' : ''}</div>
      <span class="reading-text" style="{tag ? `color:${tag.color}` : ''}">
        <strong>{task.label}</strong>{task.note ? ` — ${task.note}` : ''}
      </span>
      {#if editMode}
        <button class="task-del-btn"
          onclick={e => { e.stopPropagation(); removeTask(task.id); }} title="Remove">×</button>
      {/if}
    </div>
  {/each}

  {#if editMode}
    {#if taskFormOpen}
      <div class="task-add-form">
        <input type="text" id="new-task-label" placeholder="Task name"
          onkeydown={e => { if (e.key==='Enter') confirmTaskAdd(); if (e.key==='Escape') cancelTaskForm(); }}>
        
        <div class="type-picker" style="margin-bottom: 8px;">
          <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="type-opt {pendingTagId===''?'selected':''}"
            style="border-color: var(--border); color: var(--text-muted); background: {pendingTagId==='' ? 'var(--surface-hover)' : 'transparent'}"
            onclick={() => { pendingTagId = ''; }}>Untagged</span>
          {#each tags as t}
            <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
            <span class="type-opt {pendingTagId===t.id?'selected':''}"
              style="color: {t.color}; border-color: {t.color}; background: {pendingTagId===t.id ? t.color+'40' : 'transparent'}"
              onclick={() => { pendingTagId = t.id; }}>{t.label}</span>
          {/each}
        </div>

        <input type="text" id="new-task-note" placeholder="Description (optional)"
          onkeydown={e => { if (e.key==='Enter') confirmTaskAdd(); if (e.key==='Escape') cancelTaskForm(); }}>
        <div class="add-form-btns">
          <button class="add-confirm" onclick={confirmTaskAdd}>Add</button>
          <button class="add-cancel" onclick={cancelTaskForm}>Cancel</button>
        </div>
      </div>
    {:else}
      <button class="add-task-btn" onclick={openTaskForm}>+ add task</button>
    {/if}
  {/if}
</div>
