# Sprint Track v2: Sync Architecture & "Bring Your Own Storage"

This document outlines the v2 roadmap for transforming "Now That's a Dandy Routine!" from a purely local PWA into a robust, offline-first application capable of Obsidian-style synchronization across devices using user-provided cloud storage (GitHub) or a managed premium backend (Supabase).

---

## Sprint 10 — Storage Abstraction & CRDTs
**Goal:** Decouple the application from naive `localStorage` and implement robust conflict resolution to prepare for multi-device sync.

### Abstraction Layer
- [x] Create `StorageAdapter` interface.
- [x] Implement `LocalStorageAdapter` that adheres to the new interface.
- [x] Refactor all Svelte components to use the adapter instead of calling `localStorage` directly.

### State Conflict Resolution (Last-Write-Wins)
- [x] Refactor `state.checked` and `state.tasks` from simple booleans to timestamped objects: `{ value: true, updatedAt: 17180000 }`.
- [x] Implement `mergeState(local, cloud)` utility to resolve conflicts using LWW timestamps.
- [x] Write Vitest unit tests verifying correct merge behavior on conflicting local and cloud changes.

---

## Sprint 11 — The Sync Engine & Offline Queue
**Goal:** Build the background worker that handles pushing and pulling data automatically without locking the UI.

### Offline Queue
- [x] Create an offline mutation queue that stores pending actions if the device has no internet connection.
- [x] Implement a debounced "Flush" mechanism that runs 5 minutes after inactivity or on page hide, pushing the queue to the active storage adapter.
- [x] Hook into `navigator.onLine` to trigger a queue flush upon reconnection.

### Sync UI
- [x] Add a visual "Sync Status" indicator in the application header (e.g., 🟢 Synced, 🟡 Syncing, 🔴 Offline/Pending).
- [x] Implement an initial "Hydrate" screen overlay that briefly blocks UI when first downloading cloud state on a new device.

---

## Sprint 12 — "Bring Your Own Sync" (GitHub)
**Goal:** Implement the power-user feature allowing users to sync their data for free via a private GitHub repository.

### GitHub Adapter
- [x] Implement `GitHubAdapter` that uses the GitHub REST API to read/write JSON files to a specified repository.
- [x] Implement file lock or ETag checking to prevent overwriting parallel commits from other devices.

### Settings UI
- [x] Create a "Bring Your Own Sync" configuration section in the Settings Modal.
- [x] Add input fields for: GitHub Username, Repository Name, and Personal Access Token (PAT).
- [x] Encrypt/Securely store the PAT locally so it is not exposed in plain text.

---

## Sprint 13 — "Dandy Sync" (Managed Backend)
**Goal:** Implement the frictionless, paid-tier managed sync solution using Supabase.

### Supabase Adapter
- [x] Implement `SupabaseAdapter`.
- [x] Design Supabase schema for storing timestamped checkmarks and reviews.
- [x] Implement Row Level Security (RLS) policies ensuring users can only read/write their own UID data.

---

## Sprint 13.5 — Account & Profile UI
**Goal:** Build the sign-in experience and an account panel (display name + uploadable avatar) for Dandy Sync users, and wire `SupabaseAdapter` into the live sync engine.

### Auth
- [x] Implement magic-link sign-in/sign-up flow (email input → "Send magic link" → handle the auth redirect/session).
- [x] Implement "Sign Out" that gracefully reverts the user back to pure `LocalStorageAdapter`.
- [x] Wire `SyncEngine` to use `supabaseAdapter` when `provider === 'supabase'` and the user is signed in.

### Profile Schema & Storage
- [ ] Create `profiles` table (`user_id` PK references `auth.users`, `display_name`, `avatar_url`, `updated_at`) with RLS scoped to `auth.uid()`.
- [ ] Create an `avatars` Supabase Storage bucket with RLS policies scoped to `auth.uid()` (path prefixed by user id).
- [ ] Implement profile get/update and avatar upload/remove (new `ProfileAdapter` or methods on `SupabaseAdapter`).

### Account UI (Settings)
- [ ] Add an "Account" section to the Settings Modal, alongside Cloud Sync.
- [ ] Signed-out state: email input + "Send magic link" button + status message.
- [ ] Signed-in state: editable display name (autosave), avatar upload/preview/remove, sign-out button.

---

## Sprint 13.6 — Sync Correctness & History
**Goal:** Fix gaps found in the post-13.5 audit so Dandy Sync and the Stats Dashboard are trustworthy before building Sprint 14 (Social & Sharing) on top of them.

### Full history sync
- [x] Extend `exportData()`/`importData()` (or add a dedicated path) to include all `ls-week-*` entries, not just the current week, so historical reviews/stats sync across devices.
- [x] Apply `mergeState()`/LWW merging per-week on hydrate, not just for the current week.
- [x] Consider payload size/perf implications of syncing full history every flush (e.g. only sync weeks changed since last sync, or a separate table/row-per-week in Supabase). — Decided to defer: fine at personal scale, full-history-per-flush is acceptable for now; revisit if payload size becomes a problem.

### Stats Dashboard bug fixes (Q6)
- [x] Fix `stats.js` to read `state.checked` instead of the nonexistent `state.checkmarks` for historical adherence counts.
- [x] Fix the tag-completion lookup to match on `session.id` instead of the nonexistent `session.time`.
- [x] Update `generateDummyStats()` to write `checked` (matching real data shape) so dev mock stats don't mask real bugs.
- [x] Verify against real saved week data that adherence % and tag completions are no longer always 0. — Covered by new `tests/stats.test.js`.

### Sync config isolation
- [x] Stop round-tripping the GitHub BYO-sync config (`githubUsername`/`githubRepo`/`githubToken`) through Dandy Sync's cloud payload, so signing into Dandy Sync on a second device doesn't clobber that device's local GitHub config. — `syncConfig` removed from `exportData()`/`importData()` entirely; sync provider settings are now purely per-device.

### Docs
- [x] Update `docs/Architecture.md` to reflect the current local-first + optional cloud-sync (GitHub/Supabase) model — it currently says "No Auth Required" and describes a pure-localStorage approach, which predates Sprints 12-13.

---

## Sprint 14 — Social & Sharing
**Goal:** Leverage the new cloud capabilities (Supabase/GitHub) to allow users to share their schedules and hold themselves accountable.

- [ ] Generate unique read-only URL links for a user's schedule.
- [ ] Create a public-facing read-only view of the WeekGrid.
- [ ] Allow users to revoke or regenerate their sharing link in Settings.

---

## Sprint 15 — Gamification & Power Features
**Goal:** Deliver highly requested productivity and habit-building mechanics.

### Habits & Notifications
- [ ] Implement Streak tracking across weeks (visual fire icon and counter for consecutive weeks a goal is met).
- [ ] Implement Browser Push Notifications to remind users of scheduled sessions.

### Advanced Management
- [ ] Build Multi-Schedule support (allow switching between "Summer", "School", and "Work" seasonal schedules without losing the historical data of the previous ones).
- [ ] Implement PDF Export for Weekly Reviews (formatted and styled for printing/archiving).

---

## Sprint 16 — Native Desktop App (Tauri)
**Goal:** Break out of the browser completely for users who want a dedicated offline app experience.

- [ ] Wrap the Svelte 5 application in Tauri.
- [ ] Build for Windows (`.exe`) and macOS (`.dmg`).
- [ ] Hook the Tauri app into the `StorageAdapter` to save directly to the local filesystem instead of `localStorage`.
