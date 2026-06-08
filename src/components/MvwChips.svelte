<script>
  import { getMVW } from '../lib/mvw.js';
  import { getTagsSync, saveTags } from '../lib/storage.js';

  let { weekState, scheduleVersion } = $props();

  let showConfig = $state(false);
  let tags = $state(getTagsSync());
  let configVersion = $state(0);

  let chips = $derived.by(() => {
    scheduleVersion; // track dependency
    configVersion;   // track config changes
    return getMVW(weekState);
  });

  function saveConfig() {
    saveTags(tags);
    configVersion++;
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

  function deleteTag(tag) {
    if (confirm(`Delete ${tag.label}? Sessions and tasks using this tag will become untagged.`)) {
      tags = tags.filter(t => t.id !== tag.id);
      saveConfig();
    }
  }
</script>

<div class="mvw-section">
  <div class="mvw-header-row">
    <div class="mvw-label">Minimum viable week</div>
    <button class="mvw-edit-btn" onclick={() => showConfig = !showConfig}>
      {showConfig ? 'Close tags' : 'Manage tags'}
    </button>
  </div>

  {#if showConfig}
    <div class="mvw-config-panel">
      {#each tags as tag}
        <div class="config-row">
          <div style="display: flex; align-items: center; gap: 6px;">
            <input type="color" value={tag.color} onchange={(e) => updateColor(tag, e)} style="width: 20px; height: 20px; padding: 0; border: none; cursor: pointer; border-radius: 4px; background: none;" title="Tag Colour">
            <input type="text" value={tag.label} onchange={(e) => updateLabel(tag, e)} style="width: 100px; background: transparent; border: 1px dashed transparent; color: var(--text); font-family: inherit; font-size: inherit; font-weight: inherit;" onfocus={(e) => e.target.style.border='1px dashed var(--border)'} onblur={(e) => e.target.style.border='1px dashed transparent'} title="Rename Tag">
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
            <button onclick={() => deleteTag(tag)} style="color: var(--pink); background: none; font-size: 14px; margin-left: 4px;" title="Delete Tag">×</button>
          </div>
        </div>
      {/each}
      <button onclick={addTag} style="grid-column: 1 / -1; padding: 6px; background: var(--surface-hover); border: 1px dashed var(--border); color: var(--text-muted); cursor: pointer; border-radius: 6px; font-size: 12px; font-weight: 500;">+ Add New Goal</button>
    </div>
  {/if}

  <div class="mvw-chips">
    {#each chips as item}
      <span 
        class="chip {item.done ? 'done' : item.partial ? 'partial' : ''}"
        style={item.done ? `border-color: ${item.color}; background: ${item.color}22; color: ${item.color};` : item.partial ? `border-color: ${item.color}; color: ${item.color};` : ''}
      >
        {item.done ? '✓ ' : ''}{item.label}
      </span>
    {/each}
  </div>
</div>
