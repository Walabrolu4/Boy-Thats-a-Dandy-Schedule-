<script>
  import { onMount } from 'svelte';
  import { Line, Bar } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    BarElement,
  } from 'chart.js';
  import { getStats } from '../lib/stats.js';
  import { getTagsSync } from '../lib/storage.js';

  ChartJS.register(
    Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, BarElement
  );

  let { showStats = $bindable(false) } = $props();

  let lineData = $state(null);
  let barData = $state(null);
  let hasData = $state(false);

  // Recompute when showStats opens
  $effect(() => {
    if (showStats) {
      const stats = getStats();
      if (stats.length === 0) {
        hasData = false;
        return;
      }
      hasData = true;

      // Prepare Line Chart (Adherence over time)
      const labels = stats.map(s => {
        const d = new Date(s.dateRaw + 'T12:00:00Z');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const adherenceData = stats.map(s => s.adherencePercent);

      lineData = {
        labels,
        datasets: [
          {
            label: 'Schedule Adherence (%)',
            data: adherenceData,
            fill: false,
            borderColor: '#bd93f9', // Brand purple
            backgroundColor: '#bd93f9',
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: '#bd93f9',
            pointRadius: 4
          }
        ]
      };

      // Prepare Bar Chart (Goals completed overall)
      const tags = getTagsSync();
      const tagCompletedTotals = {};
      const tagScheduledTotals = {};
      tags.forEach(t => {
        tagCompletedTotals[t.id] = 0;
        tagScheduledTotals[t.id] = 0;
      });

      for (const week of stats) {
        for (const [tagId, count] of Object.entries(week.tagCompletions || {})) {
          if (tagCompletedTotals[tagId] !== undefined) tagCompletedTotals[tagId] += count;
        }
        for (const [tagId, count] of Object.entries(week.tagScheduled || {})) {
          if (tagScheduledTotals[tagId] !== undefined) tagScheduledTotals[tagId] += count;
        }
      }

      const barLabels = [];
      const barCounts = [];
      const barColors = [];

      for (const tag of tags) {
        barLabels.push(tag.label);
        const sched = tagScheduledTotals[tag.id];
        const comp = tagCompletedTotals[tag.id];
        const pct = sched > 0 ? Math.round((comp / sched) * 100) : 0;
        barCounts.push(pct);
        barColors.push(tag.color);
      }

      barData = {
        labels: barLabels,
        datasets: [
          {
            label: 'Completion (%)',
            data: barCounts,
            backgroundColor: barColors,
            borderRadius: 6
          }
        ]
      };
    }
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#a0a0a0' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#a0a0a0' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#a0a0a0' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  function close() {
    showStats = false;
  }
</script>

{#if showStats}
  <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={close}>
    <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content stats-modal" onclick={e => e.stopPropagation()}>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h3 style="margin: 0; font-size: 24px; color: var(--text);">Analytics & Trends</h3>
        <button class="close-btn" onclick={close} aria-label="Close analytics" style="background: none; border: none; color: var(--text-muted); font-size: 28px; cursor: pointer;">×</button>
      </div>

      {#if !hasData}
        <div class="empty-state">
          <p>Not enough historical data to generate charts yet.</p>
          <p>Complete a few weeks to see your trends appear here!</p>
        </div>
      {:else}
        <div class="charts-container">
          <div class="chart-box">
            <h4>Adherence Trend</h4>
            <div class="chart-wrapper">
              {#if lineData}
                <Line data={lineData} options={{...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 100 }}}} />
              {/if}
            </div>
          </div>

          <div class="chart-box">
            <h4>Habit Breakdown</h4>
            <div class="chart-wrapper">
              {#if barData}
                <Bar data={barData} options={{...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 100 }}}} />
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .stats-modal {
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  .empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: 60px 20px;
    background: var(--surface-hover);
    border-radius: 12px;
  }
  .charts-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .chart-box {
    background: var(--surface-hover);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--border);
  }
  .chart-box h4 {
    margin: 0 0 16px 0;
    color: var(--text);
    font-weight: 500;
  }
  .chart-wrapper {
    position: relative;
    height: 300px;
    width: 100%;
  }
</style>
