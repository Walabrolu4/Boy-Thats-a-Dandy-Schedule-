<script>
  import { getTasks, saveTasks, getTagsSync } from '../lib/storage.js';
  import { globalStore, saveGlobalState, toggleEditMode, incrementScheduleVersion } from '../lib/store.svelte.js';

  let tasks = $derived.by(() => {
    globalStore.scheduleVersion; // track dependency
    return getTasks();
  });

  let tags = $derived.by(() => {
    globalStore.scheduleVersion;
    return getTagsSync();
  });

  let taskFormOpen = $state(false);
  let pendingTagId = $state('');

  function toggleTask(taskId) {
    if (globalStore.editMode) return;
    const current = globalStore.weekState.tasks[taskId]?.value ?? false;
    globalStore.weekState.tasks[taskId] = { value: !current, updatedAt: Date.now() };
    saveGlobalState();
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
    incrementScheduleVersion();
  }

  function removeTask(taskId) {
    saveTasks(getTasks().filter(t => t.id !== taskId));
    delete globalStore.weekState.tasks[taskId];
    saveGlobalState();
    incrementScheduleVersion();
  }
  let draggedTaskId = $state(null);

  function handleDragStart(e, taskId) {
    draggedTaskId = taskId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, targetTaskId) {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const allTasks = getTasks();
    const draggedIndex = allTasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = allTasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const taskList = [...allTasks];
      const [draggedItem] = taskList.splice(draggedIndex, 1);
      taskList.splice(targetIndex, 0, draggedItem);
      saveTasks(taskList);
      incrementScheduleVersion(); // Trigger reactivity
    }
    draggedTaskId = null;
  }
</script>

<div class="section-heading">Unscheduled</div>
<div id="tasksSection">
  {#each tasks as task (task.id)}
    {@const done = !!(globalStore.weekState.tasks?.[task.id]?.value)}
    {@const tag = tags.find(t => t.id === task.tagId)}
    <!-- svelte-ignore a11y_no_static_element_interactions --><!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="task-row {globalStore.editMode?'task-row-edit':''} {draggedTaskId === task.id ? 'dragging' : ''}"
      draggable={globalStore.editMode}
      ondragstart={e => { if(globalStore.editMode) handleDragStart(e, task.id); }}
      ondragover={e => { if(globalStore.editMode) handleDragOver(e); }}
      ondrop={e => { if(globalStore.editMode) handleDrop(e, task.id); }}
      onclick={() => { if (!globalStore.editMode) toggleTask(task.id); }}>
      <div class="r-check {done?'done':''}" style="{tag && done ? `background:${tag.color}; border-color:${tag.color};` : tag ? `border-color:${tag.color}80` : ''}">{done ? '✓' : ''}</div>
      <span class="reading-text" style="{tag ? `color:${tag.color}` : ''}">
        <strong>{task.label}</strong>{task.note ? ` — ${task.note}` : ''}
      </span>
      {#if globalStore.editMode}
        <button class="task-del-btn"
          onclick={e => { e.stopPropagation(); removeTask(task.id); }} title="Remove">×</button>
      {/if}
    </div>
  {/each}

  {#if globalStore.editMode}
    {#if taskFormOpen}
      <div class="task-add-form">
        <input type="text" id="new-task-label" placeholder="Task name"
          onkeydown={e => { if (e.key==='Enter') confirmTaskAdd(); if (e.key==='Escape') cancelTaskForm(); }}>
        
        <div class="type-picker" style="margin-bottom: 8px;">
          <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="task-chip {pendingTagId==='' ? 'selected' : ''}"
            style="border-color: var(--border); color: var(--text-muted); background: {pendingTagId==='' ? 'var(--surface-hover)' : 'transparent'}"
            onclick={() => { pendingTagId = ''; }}>No Goal</span>
          {#each tags as t}
            {@const tag = t}
            <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
            <span class="task-chip {pendingTagId===t.id?'selected':''}"
              style="color: {tag ? tag.color : 'inherit'}; border: 1px solid {tag ? (pendingTagId===t.id ? tag.color : tag.color+'40') : 'var(--border)'}; background: {tag ? (pendingTagId===t.id ? tag.color+'22' : tag.color+'11') : 'transparent'};"
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
