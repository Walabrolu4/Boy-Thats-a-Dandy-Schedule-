<script>
  import { getTheme, saveTheme } from '../lib/storage.js';

  let currentTheme = $state(getTheme());
  let isOpen = $state(false);

  const themes = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'purple', label: 'Brand purple' },
    { id: 'forest', label: 'Green forest' },
    { id: 'ocean', label: 'Blue ocean' },
    { id: 'pink', label: 'Hot pink' },
    { id: 'disco', label: '90s disco' }
  ];

  // Set the theme on the document whenever it changes
  $effect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    saveTheme(currentTheme);
  });

  function toggleOpen() {
    isOpen = !isOpen;
  }

  function selectTheme(id) {
    currentTheme = id;
    isOpen = false;
  }

  // Close when clicking outside
  function handleWindowClick(e) {
    if (isOpen && !e.target.closest('.theme-picker')) {
      isOpen = false;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="theme-picker">
  <button class="btn btn-icon" onclick={toggleOpen} title="Change Theme">
    ⚙️
  </button>
  {#if isOpen}
    <div class="dropdown">
      {#each themes as theme}
        <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="dropdown-item {currentTheme === theme.id ? 'active' : ''}" 
          onclick={() => selectTheme(theme.id)}
        >
          {theme.label}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .theme-picker {
    position: relative;
    display: inline-block;
  }
  .btn-icon {
    padding: 6px 9px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    padding: 4px;
    z-index: 100;
    min-width: 140px;
  }
  .dropdown-item {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .dropdown-item:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
  .dropdown-item.active {
    background: var(--purple-bg);
    color: var(--purple);
    font-weight: 600;
  }
</style>
