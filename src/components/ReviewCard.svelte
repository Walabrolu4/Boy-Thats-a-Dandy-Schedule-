<script>
  import { getState, saveState, getWeekRange } from '../lib/storage.js';
  import { saveWeeklyReview } from '../lib/export.js';

  export let weekState;
  export let onStateChange;

  let reviewOpen = false;
  let q1 = '', q2 = '', q3 = '';
  let reviewTimer = null;
  let savedFlash = false;
  let exportFlashMsg = '';
  let exportFlashVisible = false;
  let savingReview = false;

  // Populate textarea values when panel is opened
  function toggleReview() {
    reviewOpen = !reviewOpen;
    if (reviewOpen) {
      const r = weekState.review || {};
      q1 = r.q1 || '';
      q2 = r.q2 || '';
      q3 = r.q3 || '';
    }
  }

  function autoSaveReview() {
    clearTimeout(reviewTimer);
    reviewTimer = setTimeout(() => {
      weekState.review = { q1, q2, q3 };
      onStateChange(weekState);
      savedFlash = true;
      setTimeout(() => { savedFlash = false; }, 1500);
    }, 600);
  }

  async function handleSaveReview() {
    await saveWeeklyReview({
      onStart:   () => { savingReview = true; },
      onSuccess: (msg) => { showExportFlash(msg); },
      onError:   (msg) => { showExportFlash(msg); },
      onFinally: () => { savingReview = false; },
    });
  }

  function showExportFlash(msg) {
    exportFlashMsg = msg;
    exportFlashVisible = true;
    setTimeout(() => { exportFlashVisible = false; }, 3000);
  }
</script>

<div class="review-card">
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="review-toggle" on:click={toggleReview}>
    <span>Weekly review</span>
    <span class="toggle-hint">{reviewOpen ? 'hide ↑' : 'show ↓'}</span>
  </div>

  <div class="review-body {reviewOpen ? 'open' : ''}">
    <div class="q-label">Which sessions didn't happen, and why?</div>
    <textarea bind:value={q1} placeholder="…" on:input={autoSaveReview}></textarea>

    <div class="q-label">Where did I get stuck?</div>
    <textarea bind:value={q2} placeholder="…" on:input={autoSaveReview}></textarea>

    <div class="q-label">One thing I want to protect time for next week</div>
    <textarea bind:value={q3} placeholder="…" on:input={autoSaveReview}></textarea>

    <div class="review-footer">
      <button class="save-to-file-btn" id="saveReviewBtn"
        disabled={savingReview}
        on:click={handleSaveReview}>
        {savingReview ? 'Saving…' : 'Save to file'}
      </button>
      <span class="saved-flash {exportFlashVisible ? 'show' : ''}">{exportFlashMsg}</span>
      <span class="saved-flash autosave-flash {savedFlash ? 'show' : ''}">Auto-saved ✓</span>
    </div>
  </div>
</div>
