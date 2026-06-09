<script>
  import { getMVW } from '../lib/mvw.js';
  import { getTagsSync, saveTags, getTasks, saveTasks, getSchedule, saveSchedule } from '../lib/storage.js';

  let { weekState, scheduleVersion, onScheduleChange, showConfig = $bindable(false) } = $props();

  let tags = $state(getTagsSync());
  let configVersion = $state(0);

  let tagToDelete = $state(null);
  let deleteAllTasks = $state(false);

  let chips = $derived.by(() => {
    scheduleVersion; // track dependency
    configVersion;   // track config changes
    return getMVW(weekState);
  });

  function saveConfig() {
    saveTags(tags);
    configVersion++;
    onScheduleChange?.(); // Force app to reload tags from storage across components
  }

  function adjustTarget(tag, delta) {
    if (tag.mvwOutOf !== undefined) {
      tag.mvwTarget = Math.max(0, Math.min(tag.mvwOutOf, tag.mvwTarget + delta));
    } else {
      tag.mvwTarget = Math.max(0, tag.mvwTarget + delta);
    }
    saveConfig();
  }

  function toggleBool(tag) {
    tag.mvwTarget = tag.mvwTarget === 0 ? 1 : 0;
    saveConfig();
  }

  function updateColor(tag, e) {
    tag.color = e.target.value;
    saveConfig();
  }

  function updateLabel(tag, e) {
    tag.label = e.target.value;
    saveConfig();
  }

  function addTag() {
    tags.push({
      id: 'tag-' + Date.now(),
      label: 'New Goal',
      color: '#ff00ff',
      mvwTarget: 1
    });
    saveConfig();
  }

  function promptDeleteTag(tag) {
    tagToDelete = tag;
    deleteAllTasks = false;
  }

  function confirmDeleteTag() {
    if (!tagToDelete) return;
    const tagId = tagToDelete.id;

    let tasks = getTasks();
    if (deleteAllTasks) {
      tasks = tasks.filter(t => t.tagId !== tagId);
    } else {
      tasks = tasks.map(t => {
        if (t.tagId === tagId) {
          const { tagId: _, ...rest } = t;
          return rest;
        }
        return t;
      });
    }
    saveTasks(tasks);

    let schedule = getSchedule();
    schedule.forEach(day => {
      if (deleteAllTasks) {
        day.sessions = day.sessions.filter(s => s.tagId !== tagId);
      } else {
        day.sessions = day.sessions.map(s => {
          if (s.tagId === tagId) {
            const { tagId: _, ...rest } = s;
            return rest;
          }
          return s;
        });
      }
    });
    saveSchedule(schedule);

    tags = tags.filter(t => t.id !== tagId);
    saveConfig(); // saves tags and triggers onScheduleChange

    tagToDelete = null;
  }

  function cancelDeleteTag() {
    tagToDelete = null;
  }
</script>

<div class="mvw-section">
  <div class="mvw-header-row">
    <div class="mvw-label">Weekly Goals</div>
  </div>

  {#if showConfig}
    <div class="mvw-config-panel">
      {#each tags as tag}
        <div class="config-row">
          <div style="display: flex; align-items: center; gap: 6px;">
            <input type="color" value={tag.color} onchange={(e) => updateColor(tag, e)} style="width: 20px; height: 20px; padding: 0; border: none; cursor: pointer; border-radius: 4px; background: none;" title="Goal Colour">
            <input type="text" value={tag.label} onchange={(e) => updateLabel(tag, e)} style="width: 100px; background: transparent; border: 1px dashed transparent; color: var(--text); font-family: inherit; font-size: inherit; font-weight: inherit;" onfocus={(e) => e.target.style.border='1px dashed var(--border)'} onblur={(e) => e.target.style.border='1px dashed transparent'} title="Rename Goal">
          </div>
          
          <div class="config-controls">
            {#if tag.mvwOutOf !== undefined}
              <button onclick={() => adjustTarget(tag, -1)}>−</button>
              <span>{tag.mvwTarget} / {tag.mvwOutOf}</span>
              <button onclick={() => adjustTarget(tag, 1)}>+</button>
            {:else}
              <button onclick={() => adjustTarget(tag, -1)}>−</button>
              <span>{tag.mvwTarget}</span>
              <button onclick={() => adjustTarget(tag, 1)}>+</button>
              <button onclick={() => toggleBool(tag)} style="width: auto; padding: 0 8px; font-size: 10px;">
                {tag.mvwTarget > 0 ? 'ON' : 'OFF'}
              </button>
            {/if}
            <button onclick={() => promptDeleteTag(tag)} style="color: var(--pink); background: none; font-size: 14px; margin-left: 4px;" title="Delete Goal">×</button>
          </div>
        </div>
      {/each}
      <button onclick={addTag} style="grid-column: 1 / -1; padding: 6px; background: var(--surface-hover); border: 1px dashed var(--border); color: var(--text-muted); cursor: pointer; border-radius: 6px; font-size: 12px; font-weight: 500;">+ Add Goal</button>
    </div>
  {/if}

  <div class="mvw-chips">
    {#each chips as item}
      <span 
        class="chip {item.done ? 'done' : item.partial ? 'partial' : ''}"
        style="color: {item.color}; border: 1px solid {item.done ? item.color : item.color+'40'}; background: {item.done ? item.color+'33' : item.color+'15'};"
      >
        {item.done ? '✓ ' : ''}{item.label}
      </span>
    {/each}
  </div>
</div>

{#if tagToDelete}
  <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={cancelDeleteTag}>
    <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" onclick={e => e.stopPropagation()}>
      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: var(--text);">Delete {tagToDelete.label}?</h3>
      <p style="font-size: 13px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.4;">
        Removing this goal will affect tasks and scheduled sessions currently using it.
      </p>
      
      <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 13px; margin-bottom: 24px; cursor: pointer; color: var(--text);">
        <input type="checkbox" bind:checked={deleteAllTasks} style="margin-top: 2px;">
        <span>Delete all tasks and scheduled sessions associated with this goal</span>
      </label>

      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="add-cancel" onclick={cancelDeleteTag}>Cancel</button>
        <button class="add-confirm" style="background: var(--pink); color: #fff;" onclick={confirmDeleteTag}>Delete Goal</button>
      </div>
    </div>
  </div>
{/if}
