<script>
  import { getMVW } from '../lib/mvw.js';

  // props
  export let weekState;
</script>

<div class="mvw-section">
  <div class="mvw-label">Minimum viable week</div>
  <div class="mvw-chips">
    {#each getMVW(weekState) as item}
      <span class="chip {item.done ? 'done' : item.partial ? 'partial' : ''}">
        {item.done ? '✓ ' : ''}{item.label}
      </span>
    {/each}
  </div>
</div>
