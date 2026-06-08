<script>
  import { getMVW } from '../lib/mvw.js';

  let { weekState, scheduleVersion } = $props();

  let chips = $derived.by(() => {
    scheduleVersion; // track dependency
    return getMVW(weekState);
  });
</script>

<div class="mvw-section">
  <div class="mvw-label">Minimum viable week</div>
  <div class="mvw-chips">
    {#each chips as item}
      <span class="chip {item.done ? 'done' : item.partial ? 'partial' : ''}">
        {item.done ? '✓ ' : ''}{item.label}
      </span>
    {/each}
  </div>
</div>
