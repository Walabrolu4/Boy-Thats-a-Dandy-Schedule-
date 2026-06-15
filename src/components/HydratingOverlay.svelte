<script>
  let { isHydrating = false } = $props();
</script>

{#if isHydrating}
  <div class="hydrating-overlay">
    <div class="hydrating-content">
      <div class="spinner"></div>
      <h2>Downloading Data...</h2>
      <p>Synchronizing your schedule and history from the cloud.</p>
    </div>
  </div>
{/if}

<style>
  .hydrating-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  .hydrating-content {
    text-align: center;
    background: var(--surface);
    color: var(--text);
    padding: 2rem;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    border: 1px solid var(--border);
  }
  .spinner {
    width: 40px; height: 40px;
    border: 4px solid var(--border);
    border-top: 4px solid var(--purple);
    border-radius: 50%;
    margin: 0 auto 1rem auto;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  h2 { margin: 0 0 8px 0; font-size: 1.25rem; }
  p { margin: 0; font-size: 0.9rem; color: var(--text-muted); }
</style>
