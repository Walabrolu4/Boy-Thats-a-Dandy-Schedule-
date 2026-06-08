<script>
  import { getTasks, saveTasks, getState, saveState } from '../lib/storage.js';

  export let weekState;
  export let editMode;
  export let onStateChange;

  let taskFormOpen = false;

  $: tasks = getTasks();

  export function refresh() {
    tasks = getTasks();
  }

  function toggleTask(taskId) {
    if (!weekState.tasks) weekState.tasks = {};
    weekState.tasks[taskId] = !weekState.tasks[taskId];
    onStateChange(weekState);
  }

  function openTaskForm() {
    taskFormOpen = true;
    setTimeout(() => {
      const el = document.getElementById('new-task-label');
      if (el) el.focus();
    }, 30);
  }

  function cancelTaskForm() {
    taskFormOpen = false;
  }

  function confirmTaskAdd() {
    const labelEl = document.getElementById('new-task-label');
    const noteEl = document.getElementById('new-task-note');
    const label = labelEl ? labelEl.value.trim() : '';
    if (!label) { if (labelEl) labelEl.focus(); return; }
    const allTasks = getTasks();
    allTasks.push({ id: `task-${Date.now()}`, label, note: noteEl ? noteEl.value.trim() : '' });
    saveTasks(allTasks);
    tasks = getTasks();
    taskFormOpen = false;
  }

  function removeTask(taskId) {
    const remaining = getTasks().filter(t => t.id !== taskId);
    saveTasks(remaining);
    tasks = getTasks();
    // Also clear checked state for this task
    if (weekState.tasks) delete weekState.tasks[taskId];
    onStateChange(weekState);
  }
</script>

<div class="section-heading">Unscheduled</div>
<div id="tasksSection">
  {#each tasks as task}
    {@const done = !!(weekState.tasks && weekState.tasks[task.id])}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="task-row {editMode ? 'task-row-edit' : ''}"
      on:click={() => { if (!editMode) toggleTask(task.id); }}
    >
      <div class="r-check {done ? 'done' : ''}">{done ? '✓' : ''}</div>
      <span class="reading-text">
        <strong>{task.label}</strong>{task.note ? ` — ${task.note}` : ''}
      </span>
      {#if editMode}
        <button class="task-del-btn"
          on:click|stopPropagation={() => removeTask(task.id)}
          title="Remove">×</button>
      {/if}
    </div>
  {/each}

  {#if editMode}
    {#if taskFormOpen}
      <div class="task-add-form">
        <input type="text" id="new-task-label" placeholder="Task name"
          on:keydown={e => { if (e.key === 'Enter') confirmTaskAdd(); if (e.key === 'Escape') cancelTaskForm(); }}>
        <input type="text" id="new-task-note" placeholder="Description (optional)"
          on:keydown={e => { if (e.key === 'Enter') confirmTaskAdd(); if (e.key === 'Escape') cancelTaskForm(); }}>
        <div class="add-form-btns">
          <button class="add-confirm" on:click={confirmTaskAdd}>Add</button>
          <button class="add-cancel" on:click={cancelTaskForm}>Cancel</button>
        </div>
      </div>
    {:else}
      <button class="add-task-btn" on:click={openTaskForm}>+ add task</button>
    {/if}
  {/if}
</div>
