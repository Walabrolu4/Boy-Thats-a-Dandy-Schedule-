<script>
  import { onMount } from 'svelte';
  import { getWeekKey } from '../lib/storage.js';

  let pastWeeks = $state([]);
  let expandedWeek = $state(null);

  onMount(() => {
    const currentKey = getWeekKey();
    const weeks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ls-week-') && key !== currentKey) {
        try {
          const state = JSON.parse(localStorage.getItem(key));
          // Only include if there's some review content
          if (state && state.review && (state.review.q1 || state.review.q2 || state.review.q3)) {
            const dateStrRaw = key.replace('ls-week-', '');
            const d = new Date(dateStrRaw + 'T12:00:00Z');
            const dEnd = new Date(d);
            dEnd.setDate(d.getDate() + 6);
            
            const fmt = date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dateStr = `${fmt(d)} – ${fmt(dEnd)}`;
            
            weeks.push({ key, dateRaw: dateStrRaw, dateStr, review: state.review });
          }
        } catch(e) {}
      }
    }
    // Sort descending by date
    pastWeeks = weeks.sort((a, b) => {
      return new Date(b.dateRaw) - new Date(a.dateRaw);
    });
  });

  function toggleWeek(key) {
    if (expandedWeek === key) {
      expandedWeek = null;
    } else {
      expandedWeek = key;
    }
  }
</script>

{#if pastWeeks.length > 0}
  <div class="past-reviews-container">
    <h3 style="margin: 0 0 12px 0; font-size: 15px; color: var(--text);">Past Reviews</h3>
    {#each pastWeeks as week}
      <div class="past-week-card">
        <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="past-week-header" onclick={() => toggleWeek(week.key)}>
          <span>{week.dateStr}</span>
          <span style="font-size: 12px; color: var(--text-muted);">{expandedWeek === week.key ? 'collapse ↑' : 'expand ↓'}</span>
        </div>
        
        {#if expandedWeek === week.key}
          <div class="past-week-body">
            {#if week.review.q1}
              <div class="q-label">Which sessions didn't happen, and why?</div>
              <p class="q-answer">{week.review.q1}</p>
            {/if}
            {#if week.review.q2}
              <div class="q-label">Where did I get stuck?</div>
              <p class="q-answer">{week.review.q2}</p>
            {/if}
            {#if week.review.q3}
              <div class="q-label">One thing I want to protect time for next week</div>
              <p class="q-answer">{week.review.q3}</p>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .past-reviews-container {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px dashed var(--border);
  }
  .past-week-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 8px;
    background: var(--surface);
    overflow: hidden;
  }
  .past-week-header {
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    background: var(--surface-hover);
    color: var(--text);
  }
  .past-week-body {
    padding: 14px;
    border-top: 1px solid var(--border);
  }
  .q-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 6px;
    font-weight: 500;
  }
  .q-answer {
    font-size: 14px;
    color: var(--text);
    margin: 0 0 16px 0;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .q-answer:last-child {
    margin-bottom: 0;
  }
</style>
