<script>
  import { saveTags, saveSchedule, markOnboarded, getSyncConfig, saveSyncConfig } from '../lib/storage.js';
  import { buildTagsFromHabits, buildScheduleFromHabits } from '../lib/onboarding.js';
  import { incrementScheduleVersion } from '../lib/store.svelte.js';
  import { syncEngine } from '../lib/sync/SyncEngine.js';
  import { supabaseAdapter } from '../lib/sync/SupabaseAdapter.js';

  // `dismissable` controls whether this can be closed without completing -
  // false for the mandatory first-run wizard, true when re-opened from Settings.
  let { showWizard = $bindable(false), dismissable = false, onComplete } = $props();

  let step = $state(1);

  function newHabit() {
    return { name: '', frequency: 7, preferredTime: 'morning' };
  }

  let habits = $state([newHabit()]);
  let preview = $state([]);

  const frequencyOptions = [
    { value: 7, label: 'Every day' },
    { value: 1, label: '1x / week' },
    { value: 2, label: '2x / week' },
    { value: 3, label: '3x / week' },
    { value: 4, label: '4x / week' },
    { value: 5, label: '5x / week' },
    { value: 6, label: '6x / week' },
  ];

  const timeOptions = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'night', label: 'Night' },
  ];

  // Monday-first order for the preview, matching WeekGrid's display order.
  const previewOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  function addHabit() {
    habits.push(newHabit());
  }

  function removeHabit(i) {
    habits.splice(i, 1);
  }

  function closeWizard() {
    if (!dismissable) return;
    showWizard = false;
    setTimeout(() => { step = 1; }, 300);
  }

  let showSignIn = $state(false);
  let signInEmail = $state('');
  let signInStatus = $state('');
  let signInBusy = $state(false);

  async function sendOnboardingMagicLink() {
    signInBusy = true;
    signInStatus = '';
    try {
      const config = getSyncConfig();
      if (config.provider !== 'supabase') {
        config.provider = 'supabase';
        saveSyncConfig(config);
        syncEngine.refreshAuthSubscription();
      }
      await supabaseAdapter.signInWithMagicLink(signInEmail);
      signInStatus = 'Check your email for a sign-in link!';
    } catch (e) {
      signInStatus = 'Error: ' + e.message;
    } finally {
      signInBusy = false;
    }
  }

  function skipSetup() {
    markOnboarded();
    showWizard = false;
    if (onComplete) onComplete();
  }

  function reviewWeek() {
    const named = habits.filter(h => h.name.trim());
    if (named.length === 0) {
      alert(dismissable ? 'Add at least one habit, or use "Skip setup".' : 'Add at least one habit to continue.');
      return;
    }
    const schedule = buildScheduleFromHabits(habits);
    preview = previewOrder
      .map(key => schedule.find(d => d.key === key))
      .filter(Boolean);
    step = 2;
  }

  function confirmSetup() {
    const tags = buildTagsFromHabits(habits);
    const schedule = buildScheduleFromHabits(habits);
    saveTags(tags);
    saveSchedule(schedule);
    markOnboarded();
    incrementScheduleVersion();
    showWizard = false;
    if (onComplete) onComplete();
  }
</script>

{#if showWizard}
  <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={closeWizard}>
    <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" onclick={e => e.stopPropagation()}>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 20px; color: var(--text);">Welcome! Let's build your week</h3>
        {#if dismissable}
          <button class="close-btn" onclick={closeWizard} style="background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">×</button>
        {/if}
      </div>

      {#if step === 1}
        <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
          List the habits you want to build. For each one, tell us how often per week and what time of day you'd prefer - we'll lay out your first week and create matching goals automatically. This won't be shown anywhere, but it shapes the order sessions appear in each day (e.g. a morning habit floats to the top).
        </p>

        <div class="habit-list">
          {#each habits as habit, i}
            <div class="habit-row">
              <input
                type="text"
                class="habit-name-input"
                placeholder="Habit name (e.g. Stretch)"
                bind:value={habit.name}
              />
              <select class="habit-select" bind:value={habit.frequency}>
                {#each frequencyOptions as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
              <select class="habit-select" bind:value={habit.preferredTime}>
                {#each timeOptions as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
              <button type="button" class="remove-habit-btn" onclick={() => removeHabit(i)} aria-label="Remove habit">×</button>
            </div>
          {/each}
        </div>

        <button type="button" class="wizard-btn secondary" onclick={addHabit} style="margin-top: 8px;">+ Add habit</button>

        {#if !dismissable}
          <div class="onboarding-signin">
            <button type="button" class="link-btn" onclick={() => showSignIn = !showSignIn}>
              Already using Dandy Sync on another device? Sign in instead →
            </button>
            {#if showSignIn}
              <div class="signin-row">
                <input
                  type="email"
                  class="habit-name-input"
                  placeholder="you@example.com"
                  bind:value={signInEmail}
                />
                <button type="button" class="wizard-btn secondary" onclick={sendOnboardingMagicLink} disabled={signInBusy || !signInEmail}>
                  {signInBusy ? 'Sending…' : '✉️ Send Magic Link'}
                </button>
              </div>
              {#if signInStatus}
                <p style="font-size: 13px; color: var(--text-muted); margin: 6px 0 0 0;">{signInStatus}</p>
              {/if}
              <p style="font-size: 12px; color: var(--text-muted); margin: 6px 0 0 0; line-height: 1.4;">
                Signing in will pull your existing schedule from Dandy Sync and skip this setup.
              </p>
            {/if}
          </div>
        {/if}

        <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
          {#if dismissable}
            <button class="wizard-btn secondary" onclick={skipSetup}>Skip setup</button>
          {:else}
            <span></span>
          {/if}
          <button class="wizard-btn primary" onclick={reviewWeek}>Next →</button>
        </div>

      {:else if step === 2}
        <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
          Here's the week we'll build for you. You can fine-tune everything afterwards.
        </p>

        <div class="preview-schedule">
          {#each preview as day}
            <div class="preview-day">
              <strong>{day.label}</strong>
              {#if day.sessions.length > 0}
                : {day.sessions.map(s => s.label).join(', ')}
              {:else}
                <span style="color: var(--text-muted);">: rest day</span>
              {/if}
            </div>
          {/each}
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: space-between;">
          <button class="wizard-btn secondary" onclick={() => step = 1}>← Back</button>
          <button class="wizard-btn primary" onclick={confirmSetup}>Create my week</button>
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }
  .modal-content {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    max-width: 480px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
  }

  .habit-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .habit-row {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 6px;
    align-items: center;
  }
  .habit-name-input, .habit-select {
    padding: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    border-radius: 6px;
    font-size: 13px;
  }
  .habit-name-input { min-width: 0; }
  .remove-habit-btn {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--surface-hover);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
  }
  .remove-habit-btn:hover { border-color: #ff5555; color: #ff5555; }

  .onboarding-signin {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--purple);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }
  .link-btn:hover {
    text-decoration: underline;
  }
  .signin-row {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }
  .signin-row .habit-name-input {
    flex: 1;
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
    max-height: 300px;
    overflow-y: auto;
  }
  .preview-day {
    margin-bottom: 6px;
  }
  .preview-day:last-child {
    margin-bottom: 0;
  }
</style>
