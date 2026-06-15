<script>
  let { show = $bindable(false), onResolve } = $props();

  function choose(option) {
    show = false;
    if (onResolve) onResolve(option);
  }
</script>

{#if show}
  <div class="modal-overlay">
    <div class="modal-content">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; color: var(--text);">Sync conflict</h3>
      <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 20px 0; line-height: 1.5;">
        The data saved in Dandy Sync is different from what's on this device. Which one do you want to keep?
      </p>
      <div class="conflict-actions">
        <button class="conflict-btn secondary" onclick={() => choose('cloud')}>Use synced data</button>
        <button class="conflict-btn primary" onclick={() => choose('local')}>Keep this device's data</button>
      </div>
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
    z-index: 1100;
    padding: 16px;
  }
  .modal-content {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    max-width: 420px;
    width: 100%;
  }
  .conflict-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .conflict-btn {
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
  }
  .conflict-btn.primary {
    background: var(--purple);
    color: white;
  }
  .conflict-btn.primary:hover {
    background: var(--purple-dim);
  }
  .conflict-btn.secondary {
    background: var(--surface-hover);
    color: var(--text);
  }
</style>
