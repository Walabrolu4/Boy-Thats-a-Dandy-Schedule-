<script>
  import { getTheme, saveTheme } from '../lib/storage.js';

  let currentTheme = $state(getTheme());

  const themes = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'purple', label: 'Brand purple' },
    { id: 'forest', label: 'Green forest' },
    { id: 'ocean', label: 'Blue ocean' },
    { id: 'pink', label: 'Hot pink' },
    { id: 'disco', label: '90s disco' }
  ];

  $effect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    saveTheme(currentTheme);
  });
</script>

<select class="theme-select" bind:value={currentTheme}>
  {#each themes as theme}
    <option value={theme.id}>{theme.label}</option>
  {/each}
</select>

<style>
  .theme-select {
    width: 100%;
    padding: 10px 32px 10px 12px;
    font-size: 15px;
    font-family: inherit;
    color: var(--text);
    background-color: var(--surface);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 24px;
    appearance: none;
  }
  .theme-select:focus {
    outline: none;
    border-color: var(--purple);
  }
</style>
