# Sprint Track v1.5: The "Clean Slate" Refactor

Before jumping into the massive architectural shift for cross-device syncing in v2, we need to clean up the existing v1.0 codebase.

## Goals
1. Remove all remnants of backend Node server dependencies so the app functions 100% locally.
2. Replace component prop-drilling with Svelte 5 Global Runes to simplify the upcoming sync integration.
3. Fix all Svelte compilation warnings.

---

## Tasks

### 1. Remove Node Backend (`server.js`)
- [ ] Delete `server.js`.
- [ ] Rewrite `src/lib/export.js` so it dynamically creates a `Blob` containing the Markdown text and automatically triggers a browser download.

### 2. Global State Migration (Svelte 5)
- [ ] Create `src/lib/store.svelte.js` exporting global `$state` for `weekState`, `editMode`, and `scheduleVersion`.
- [ ] Refactor `App.svelte` to remove all prop passing to children.
- [ ] Refactor `WeekGrid.svelte`, `TasksSection.svelte`, and `ReviewCard.svelte` to read directly from `store.svelte.js`.

### 3. Polish
- [ ] Resolve Svelte a11y warnings (`a11y_click_events_have_key_events`) in `WeekGrid.svelte` and `SettingsModal.svelte`.
- [ ] Ensure `Features.md` and `package.json` accurately reflect the true Local-First architecture.
