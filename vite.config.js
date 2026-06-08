import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  root: '.',
  test: {
    environment: 'jsdom',
    globals: true,
    server: { deps: { inline: ['@testing-library/svelte'] } }
  },
  resolve: {
    conditions: process.env.VITEST ? ['browser'] : undefined
  }
});
