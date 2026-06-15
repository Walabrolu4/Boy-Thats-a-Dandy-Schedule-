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
- [x] Create `profiles` table (`user_id` PK references `auth.users`, `display_name`, `avatar_url`, `updated_at`) with RLS scoped to `auth.uid()`. See `supabase/profiles_schema.sql` (run once in the Supabase SQL editor).
- [x] Create an `avatars` Supabase Storage bucket with RLS policies scoped to `auth.uid()` (path prefixed by user id). Included in `supabase/profiles_schema.sql`.
- [x] Implement profile get/update and avatar upload/remove (new `ProfileAdapter` or methods on `SupabaseAdapter`). Added `getProfile()`, `updateProfile()`, `uploadAvatar()`, `removeAvatar()` to `SupabaseAdapter`.

### Account UI (Settings)
- [x] Add an "Account" section to the Settings Modal, alongside Cloud Sync.
- [x] Signed-out state: instead of duplicating the magic-link form, shows a hint pointing back to the Sync section above.
- [x] Signed-in state: editable display name (autosave on blur), avatar upload/preview/remove. (Sign-out button already existed in the Sync section.)

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

## Sprint 13.7 — Week Navigation (Plan Ahead)
**Goal:** Let users navigate back through past weeks and forward into next week (one week ahead, for planning), via back/forward arrows with "Last Week / This Week / Next Week" labels and date ranges. The currently-viewed week is fully editable (checkmarks, tasks, schedule, review where applicable) and saved to its own `ls-week-*` entry.

### Offset-aware storage layer
- [x] Generalize `getWeekKey()` → `getWeekKey(offset = 0)` and `getWeekRange()` → `getWeekRange(offset = 0)`, shifting the Friday-anchor date by `offset * 7` days (handles month/year rollovers via `Date` arithmetic).
- [x] Generalize `getState()` → `getState(offset = 0)` and `saveState(s, offset = 0)` to read/write the week at that offset (default empty `{ checked: {}, tasks: {}, review: {...} }` shape if no entry exists yet, same as today).
- [x] Add `getWeekLabel(offset)`: returns `"Last Week"` / `"This Week"` / `"Next Week"` for `-1/0/+1`, otherwise just the formatted date range (for older weeks reached via repeated back-navigation).
- [x] Unit tests for `getWeekKey(offset)`/`getWeekRange(offset)`/`getWeekLabel(offset)`, including a month-boundary and year-boundary case. — `tests/weekOffset.test.js`.

### Global store: viewed-week state
- [x] Add `globalStore.weekOffset` (default `0`), clamped to a max of `+1` (can't plan more than one week ahead); no lower bound (unlimited back-navigation through history).
- [x] `globalStore.weekState` reflects `getState(weekOffset)`; `saveGlobalState()`/`reloadGlobalState()` updated to read/write via `weekOffset`.
- [x] New `setWeekOffset(delta)` action in `store.svelte.js`: clamps the new offset, reloads `weekState` for it, and resets any transient per-week UI state (active add/edit forms, reorder/drag state, etc.) so stale references from the previous week don't linger.

### Navigation UI
- [x] Add a "week navigator" bar above the WeekGrid: `◀  [Label · date range]  ▶`.
- [x] Disable `▶` when `weekOffset === 1`. Back arrow `◀` always enabled.
- [x] "Today" highlight/dot on the day columns and the mobile "Today" tab only apply when `weekOffset === 0` (viewing any other week, no day is marked "today").
- [x] Update `App.svelte`'s header week-range display to reflect the currently-viewed week (via `getWeekRange(weekOffset)`/`getWeekLabel(weekOffset)`), not always "this week".

### Review card & future weeks
- [x] Hide or disable the end-of-week `ReviewCard` when `weekOffset === 1` (can't meaningfully review a week that hasn't happened yet).
- [x] Verify checkbox/task toggling for past and next-week views write to the correct `ls-week-*` entry via `saveState(state, weekOffset)`.

### Sync/Stats sanity check
- [x] Confirm `getAllWeekKeys()`/`exportData()`/`hydrate()` correctly pick up a newly-created next-week entry (should already work since they scan `localStorage` dynamically) — `exportData()` iterates `getAllWeekKeys()` which re-scans `localStorage` each call, so a new `ls-week-*` key created via `saveState(s, 1)` is picked up automatically. No code change needed.
- [x] Confirm `stats.js`'s "exclude current week from history" logic still uses `getWeekKey(0)` (today's actual current week), independent of whatever week the user is currently viewing. — `stats.js` calls `getWeekKey()` (offset defaults to 0), unaffected by `globalStore.weekOffset`.

---

## Sprint 13.8 — Habit Onboarding Wizard
**Goal:** Give first-time users a guided setup that replaces the generic `DEFAULT_TAGS`/`DEFAULT_DAYS` sample schedule with one built from *their* habits, so the app feels personalized from session one instead of asking them to hand-edit a stranger's routine.

### Onboarding flow & first-run detection
- [x] Add an `ls-onboarded` flag (localStorage, via `localStoreAdapter`). On `App.svelte` mount, after `syncEngine.hydrate()` resolves, show `OnboardingWizard` if the flag isn't set (covers brand-new users and users who pull a fresh cloud account with no flag yet).
- [x] Add a "Re-run setup" entry in `SettingsModal` (Data section) that re-opens the wizard on demand — useful if someone wants to regenerate their week after a big life change. Re-running always asks for confirmation since it overwrites `ls-schedule`/`ls-tags`/`ls-tasks` (same archive-old-schedule pattern as `SeasonalWizard`).
- [x] Wizard is a full-screen modal (reuse `SeasonalWizard`'s modal-overlay styling) that can't be dismissed by clicking outside on first run (must complete or explicitly skip) — skipping just sets `ls-onboarded` and keeps the existing defaults, for users who want to start from the sample schedule.

### Step 1 — Habit list builder
- [x] Repeating row UI: habit name (free text), **frequency** (`Every day` or `1`–`6` times/week — a single control, e.g. a select with "Every day" as one of the options rather than a separate toggle), and **preferred time** (`Morning` / `Afternoon` / `Evening` / `Night`).
- [x] "Add habit" button appends a new row; each row has a remove (×) button. Start with one empty row.
- [x] Minimal validation: skip rows with an empty name when generating; require at least one named habit to proceed (or allow "Skip setup").

### Step 2 — Review & generate
- [x] Show a per-day preview of the generated week (reuse the `preview-schedule` list style from `SeasonalWizard`) so users see roughly what they're getting before committing.
- [x] "Back" returns to Step 1 with entries preserved; "Create my week" runs the generator and finishes onboarding.

### Generation logic (new `src/lib/onboarding.js`)
- [x] `buildTagsFromHabits(habits)`: one tag per habit, `id` slugified from the name (deduped if collisions), `color` assigned round-robin from a small fixed palette, `mvwTarget`/`mvwOutOf` derived from frequency:
  - "Every day" → `mvwTarget: 7, mvwOutOf: 7`.
  - `N` times/week where `N > 1` → `mvwTarget: N, mvwOutOf: 7`.
  - `N === 1` → `mvwTarget: 1` (no `mvwOutOf`, matching the existing single-session tags like `prog`/`draw`).
- [x] `buildScheduleFromHabits(habits)`: starting from the 7 day-shells (`fri`...`thu`, same keys/labels/`jsDay` as `DEFAULT_DAYS`, all `sessions: []`):
  - For each habit, spread its `frequency` occurrences across the 7 days as evenly as possible (e.g. `step = 7 / frequency`, place on days `floor(i * step)` for `i in 0..frequency-1`) so e.g. a 3x/week habit lands roughly Mon/Wed/Fri-equivalent rather than three days in a row.
  - Each placed occurrence becomes a session `{ id: '<habitId>-<n>', label: habitName, tagId: habitId, note: '' }` (numbered only when `frequency > 1`, to mirror `prog1`/`prog2`).
  - **Within each day**, sort sessions by preferred time using the order Morning → Afternoon → Evening → Night, so a habit marked "Stretch, every day, Morning" is always placed at the top of each day it appears on, and a "Meditate, every day, Night" habit sinks to the bottom — mirroring the existing `DEFAULT_DAYS` convention (stretch first, meditate last).
- [x] `buildTasksFromHabits(habits)`: currently no habits map to unscheduled tasks (everything becomes a scheduled session) — leave `DEFAULT_TASKS`-style entries empty/untouched unless a later sprint adds a "no fixed time" frequency option. — Decided not to write a no-op function for this; onboarding simply never calls `saveTasks`, so existing tasks are untouched.
- [x] On "Create my week": `saveTags(tags)`, `saveSchedule(schedule)`, then call `saveState`/`incrementScheduleVersion()` as needed so `scheduleSnapshot`/`tasksSnapshot` for the current week reflect the new schedule immediately (don't leave stale snapshots from the old default). Set `ls-onboarded = true`.

### Tests
- [x] Unit tests for `buildTagsFromHabits`/`buildScheduleFromHabits` covering: "every day" frequency, 1x/week, 3x/week even-distribution, and time-of-day ordering within a day (morning habit sorts before night habit on a day they share).
- [x] Smoke test that completing the wizard sets `ls-onboarded` and that `App.svelte` doesn't show the wizard again on next mount. — Covered at the `shouldShowOnboarding()`/`markOnboarded()` level in `tests/onboarding.test.js` rather than a full component-mount test.

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
