<script>
  import ThemePicker from './ThemePicker.svelte';
  import SeasonalWizard from './SeasonalWizard.svelte';

  let { showSettings = $bindable(false) } = $props();

  let fileInput = $state();
  let showSeasonalWizard = $state(false);

  function closeSettings() {
    showSettings = false;
  }

  function handleExport() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ls-')) {
        data[key] = localStorage.getItem(key);
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dms-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    if (fileInput) {
      fileInput.click();
    }
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (typeof data === 'object' && data !== null) {
          if (confirm('This will completely overwrite your current data. Are you sure?')) {
            for (const [key, value] of Object.entries(data)) {
              if (key.startsWith('ls-')) {
                localStorage.setItem(key, value);
              }
            }
            alert('Data imported successfully. The application will now reload.');
            window.location.reload();
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse the backup file. Ensure it is a valid JSON document.');
        console.error('Import error:', err);
      }
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  }
</script>

{#if showSettings}
  <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={closeSettings}>
    <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" onclick={e => e.stopPropagation()}>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; font-size: 20px; color: var(--text);">Settings & Data</h3>
        <button class="close-btn" onclick={closeSettings} style="background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">×</button>
      </div>

      <h4 style="margin: 0 0 12px 0; font-size: 15px; color: var(--text);">App Theme</h4>
      <ThemePicker />

      <h4 style="margin: 24px 0 8px 0; font-size: 15px; color: var(--text);">Data Backup & Restore</h4>
      <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
        Export your entire schedule, goals, tasks, and history to a single JSON file. You can import this file later to completely restore your setup.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="settings-action-btn primary" onclick={handleExport}>
          📥 Export Data
        </button>
        
        <button class="settings-action-btn secondary" onclick={triggerImport}>
          📤 Import Data
        </button>
        <input type="file" accept=".json" bind:this={fileInput} onchange={handleImport} style="display: none;" />
      </div>

      <h4 style="margin: 24px 0 8px 0; font-size: 15px; color: var(--text);">Schedule Advanced</h4>
      <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5;">
        Automatically pack your existing scheduled sessions into specific available days when the season changes.
      </p>
      <button class="settings-action-btn secondary" onclick={() => showSeasonalWizard = true}>
        🍂 Seasonal Re-mapping
      </button>
    </div>
  </div>
{/if}

<SeasonalWizard bind:showWizard={showSeasonalWizard} onComplete={() => { showSeasonalWizard = false; window.location.reload(); }} />

<style>
  .settings-action-btn {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    border: 1px solid var(--border);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .settings-action-btn.primary {
    background: var(--purple-bg);
    color: var(--purple);
    border-color: var(--purple-dim);
  }
  .settings-action-btn.primary:hover {
    background: var(--purple);
    color: #fff;
  }

  .settings-action-btn.secondary {
    background: var(--surface-hover);
    color: var(--text);
  }
  .settings-action-btn.secondary:hover {
    background: var(--border-strong);
  }
</style>
