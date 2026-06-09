<script>
  import { getSchedule, saveSchedule } from '../lib/storage.js';

  let { showWizard = $bindable(false), onComplete } = $props();

  let step = $state(1);
  // availableDays maps day key -> boolean
  let availableDays = $state({
    fri: true, sat: true, sun: true, mon: true, tue: true, wed: true, thu: true
  });
  
  let newSchedule = $state([]);

  const dayNames = [
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' }
  ];

  function toggleDay(key) {
    availableDays[key] = !availableDays[key];
  }

  function closeWizard() {
    showWizard = false;
    setTimeout(() => { step = 1; }, 300); // reset after fade
  }

  function generateSchedule() {
    const currentSchedule = getSchedule();
    // 1. Extract all existing sessions
    let allSessions = [];
    for (const day of currentSchedule) {
      allSessions.push(...day.sessions);
    }
    
    // 2. Determine available days
    const activeKeys = Object.keys(availableDays).filter(k => availableDays[k]);
    if (activeKeys.length === 0) {
      alert("Please select at least one available day.");
      return;
    }

    // 3. Distribute sessions evenly across available days
    // We'll create a new schedule array
    let tempSchedule = dayNames.map(d => ({
      key: d.key,
      label: d.label,
      sessions: []
    }));

    let dayIndex = 0;
    for (const session of allSessions) {
      const targetKey = activeKeys[dayIndex % activeKeys.length];
      const targetDay = tempSchedule.find(d => d.key === targetKey);
      targetDay.sessions.push({ ...session, id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` });
      dayIndex++;
    }

    newSchedule = tempSchedule;
    step = 2;
  }

  function confirmSchedule() {
    // 1. Archive the old schedule
    const oldSchedule = getSchedule();
    const archiveKey = `ls-archive-schedule-${new Date().toISOString()}`;
    localStorage.setItem(archiveKey, JSON.stringify(oldSchedule));

    // 2. Save the new schedule
    saveSchedule(newSchedule);

    // 3. Close and reload
    closeWizard();
    if (onComplete) onComplete();
    else window.location.reload();
  }
</script>

{#if showWizard}
  <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={closeWizard}>
    <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" onclick={e => e.stopPropagation()}>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; font-size: 20px; color: var(--text);">Seasonal Re-mapping</h3>
        <button class="close-btn" onclick={closeWizard} style="background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">×</button>
      </div>

      {#if step === 1}
        <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
          Select the days you are available to work on your schedule. We will automatically redistribute all your scheduled sessions into these days.
        </p>

        <div class="days-grid">
          {#each dayNames as d}
            <button 
              class="day-btn {availableDays[d.key] ? 'active' : ''}" 
              onclick={() => toggleDay(d.key)}
            >
              {d.label}
            </button>
          {/each}
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
          <button class="wizard-btn primary" onclick={generateSchedule}>Next →</button>
        </div>

      {:else if step === 2}
        <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
          Here is your proposed new schedule. Your old schedule will be safely archived.
        </p>

        <div class="preview-schedule">
          {#each newSchedule as day}
            {#if day.sessions.length > 0}
              <div class="preview-day">
                <strong>{day.label}</strong>: {day.sessions.length} sessions
              </div>
            {/if}
          {/each}
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: space-between;">
          <button class="wizard-btn secondary" onclick={() => step = 1}>← Back</button>
          <button class="wizard-btn primary" onclick={confirmSchedule}>Confirm & Apply</button>
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  .days-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  @media (min-width: 500px) {
    .days-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .day-btn {
    padding: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .day-btn.active {
    background: var(--purple-bg);
    border-color: var(--purple-dim);
    color: var(--purple);
  }

  .wizard-btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
  }
  .wizard-btn.primary {
    background: var(--purple);
    color: white;
  }
  .wizard-btn.primary:hover {
    background: var(--purple-dim);
  }
  .wizard-btn.secondary {
    background: var(--surface-hover);
    color: var(--text);
  }

  .preview-schedule {
    background: var(--surface-hover);
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    color: var(--text);
    max-height: 200px;
    overflow-y: auto;
  }
  .preview-day {
    margin-bottom: 6px;
  }
  .preview-day:last-child {
    margin-bottom: 0;
  }
</style>
