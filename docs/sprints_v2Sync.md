# Sprint Track v2: Sync Architecture & "Bring Your Own Storage"

This document outlines the v2 roadmap for transforming "Now That's a Dandy Routine!" from a purely local PWA into a robust, offline-first application capable of Obsidian-style synchronization across devices using user-provided cloud storage (GitHub) or a managed premium backend (Supabase).

---

## Sprint 10 — Storage Abstraction & CRDTs
**Goal:** Decouple the application from naive `localStorage` and implement robust conflict resolution to prepare for multi-device sync.

### Abstraction Layer
- [ ] Create `StorageAdapter` interface.
- [ ] Implement `LocalStorageAdapter` that adheres to the new interface.
- [ ] Refactor all Svelte components to use the adapter instead of calling `localStorage` directly.

### State Conflict Resolution (Last-Write-Wins)
- [ ] Refactor `state.checked` and `state.tasks` from simple booleans to timestamped objects: `{ value: true, updatedAt: 17180000 }`.
- [ ] Implement `mergeState(local, cloud)` utility to resolve conflicts using LWW timestamps.
- [ ] Write Vitest unit tests verifying correct merge behavior on conflicting local and cloud changes.

---

## Sprint 11 — The Sync Engine & Offline Queue
**Goal:** Build the background worker that handles pushing and pulling data automatically without locking the UI.

### Offline Queue
- [ ] Create an offline mutation queue that stores pending actions if the device has no internet connection.
- [ ] Implement a debounced "Flush" mechanism that runs 5 minutes after inactivity or on page hide, pushing the queue to the active storage adapter.
- [ ] Hook into `navigator.onLine` to trigger a queue flush upon reconnection.

### Sync UI
- [ ] Add a visual "Sync Status" indicator in the application header (e.g., 🟢 Synced, 🟡 Syncing, 🔴 Offline/Pending).
- [ ] Implement an initial "Hydrate" screen overlay that briefly blocks UI when first downloading cloud state on a new device.

---

## Sprint 12 — "Bring Your Own Sync" (GitHub)
**Goal:** Implement the power-user feature allowing users to sync their data for free via a private GitHub repository.

### GitHub Adapter
- [ ] Implement `GitHubAdapter` that uses the GitHub REST API to read/write JSON files to a specified repository.
- [ ] Implement file lock or ETag checking to prevent overwriting parallel commits from other devices.

### Settings UI
- [ ] Create a "Bring Your Own Sync" configuration section in the Settings Modal.
- [ ] Add input fields for: GitHub Username, Repository Name, and Personal Access Token (PAT).
- [ ] Encrypt/Securely store the PAT locally so it is not exposed in plain text.

---

## Sprint 13 — "Dandy Sync" (Managed Backend)
**Goal:** Implement the frictionless, paid-tier managed sync solution using Supabase.

### Supabase Adapter
- [ ] Implement `SupabaseAdapter`.
- [ ] Design Supabase schema for storing timestamped checkmarks and reviews.
- [ ] Implement Row Level Security (RLS) policies ensuring users can only read/write their own UID data.

### Authentication UI
- [ ] Implement a "Dandy Sync" login portal in the Settings Modal using Supabase Magic Link auth.
- [ ] Implement "Sign Out" functionality that gracefully reverts the user back to pure `LocalStorageAdapter`.

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
