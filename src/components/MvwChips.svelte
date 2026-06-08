<script>
  import { getMVW } from '../lib/mvw.js';
  import { getMVWConfig, saveMVWConfig } from '../lib/storage.js';

  let { weekState, scheduleVersion } = $props();

  let showConfig = $state(false);
  let config = $state(getMVWConfig());
  let configVersion = $state(0);

  let chips = $derived.by(() => {
    scheduleVersion; // track dependency
    configVersion;   // track config changes
    return getMVW(weekState);
  });

  function saveConfig() {
    saveMVWConfig(config);
    configVersion++;
  }

  function adjustTarget(key, delta) {
    // If it's a count-based one (has outOf), clamp between 0 and outOf
    if (config[key].outOf !== undefined) {
      config[key].target = Math.max(0, Math.min(config[key].outOf, config[key].target + delta));
    } else {
      config[key].target = Math.max(0, config[key].target + delta);
    }
    saveConfig();
  }

  function adjustOutOf(key, delta) {
    if (config[key].outOf !== undefined) {
      config[key].outOf = Math.max(1, config[key].outOf + delta);
      // Ensure target doesn't exceed new outOf
      if (config[key].target > config[key].outOf) {
        config[key].target = config[key].outOf;
      }
      saveConfig();
    }
  }

  function toggleBool(key) {
    config[key].target = config[key].target === 0 ? 1 : 0;
    saveConfig();
  }
</script>

<div class="mvw-section">
  <div class="mvw-header-row">
    <div class="mvw-label">Minimum viable week</div>
    <button class="mvw-edit-btn" onclick={() => showConfig = !showConfig}>
      {showConfig ? 'Close targets' : 'Edit targets'}
    </button>
  </div>

  {#if showConfig}
    <div class="mvw-config-panel">
      <!-- Stretch -->
      <div class="config-row">
        <span>Stretch</span>
        <div class="config-controls">
          <button onclick={() => adjustTarget('stretch', -1)}>−</button>
          <span>{config.stretch.target} / {config.stretch.outOf}</span>
          <button onclick={() => adjustTarget('stretch', 1)}>+</button>
        </div>
      </div>
      <!-- Meditate -->
      <div class="config-row">
        <span>Meditate</span>
        <div class="config-controls">
          <button onclick={() => adjustTarget('meditate', -1)}>−</button>
          <span>{config.meditate.target} / {config.meditate.outOf}</span>
          <button onclick={() => adjustTarget('meditate', 1)}>+</button>
        </div>
      </div>
      <!-- Exercise -->
      <div class="config-row">
        <span>Exercise</span>
        <div class="config-controls">
          <button onclick={() => adjustTarget('exer', -1)}>−</button>
          <span>{config.exer.target} / {config.exer.outOf}</span>
          <button onclick={() => adjustTarget('exer', 1)}>+</button>
        </div>
      </div>
      
      <!-- Booleans -->
      <div class="config-row">
        <span>Programming</span>
        <div class="config-controls">
          <button onclick={() => toggleBool('prog')} style="width: auto; padding: 0 8px;">
            {config.prog.target > 0 ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      <div class="config-row">
        <span>Drawing</span>
        <div class="config-controls">
          <button onclick={() => toggleBool('draw')} style="width: auto; padding: 0 8px;">
            {config.draw.target > 0 ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      <div class="config-row">
        <span>Keyboard</span>
        <div class="config-controls">
          <button onclick={() => toggleBool('keys')} style="width: auto; padding: 0 8px;">
            {config.keys.target > 0 ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <div class="mvw-chips">
    {#each chips as item}
      <span class="chip {item.done ? 'done' : item.partial ? 'partial' : ''}">
        {item.done ? '✓ ' : ''}{item.label}
      </span>
    {/each}
  </div>
</div>
