<script>
  import { saveWeeklyReview } from '../lib/export.js';
  import PastReviews from './PastReviews.svelte';

  let { weekState, onStateChange } = $props();

  let reviewOpen = $state(false);
  let q1 = $state('');
  let q2 = $state('');
  let q3 = $state('');
  let reviewTimer = null;
  let savedFlash = $state(false);
  let exportFlashMsg = $state('');
  let exportFlashVisible = $state(false);
  let savingReview = $state(false);

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
      onSuccess: (msg) => showExportFlash(msg),
      onError:   (msg) => showExportFlash(msg),
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
  <!-- svelte-ignore a11y_no_static_element_interactions --><!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="review-toggle" onclick={toggleReview}>
    <span>Weekly review</span>
    <span class="toggle-hint">{reviewOpen ? 'hide ↑' : 'show ↓'}</span>
  </div>

  <div class="review-body {reviewOpen ? 'open' : ''}">
    <div class="q-label">Which sessions didn't happen, and why?</div>
    <textarea bind:value={q1} placeholder="…" oninput={autoSaveReview}></textarea>

    <div class="q-label">Where did I get stuck?</div>
    <textarea bind:value={q2} placeholder="…" oninput={autoSaveReview}></textarea>

    <div class="q-label">One thing I want to protect time for next week</div>
    <textarea bind:value={q3} placeholder="…" oninput={autoSaveReview}></textarea>

    <div class="review-footer">
      <button class="save-to-file-btn" id="saveReviewBtn"
        disabled={savingReview}
        onclick={handleSaveReview}>
        {savingReview ? 'Saving…' : 'Save to file'}
      </button>
      <span class="saved-flash {exportFlashVisible ? 'show' : ''}">{exportFlashMsg}</span>
      <span class="saved-flash autosave-flash {savedFlash ? 'show' : ''}">Auto-saved ✓</span>
    </div>
    
    <PastReviews />
  </div>
</div>
