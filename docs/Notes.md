# Notes

Running log of decisions, context, and things to remember across sessions.

---

### Sprint 0 — Repo Hygiene
Completed git initialization, deleted old partial repo, and force-pushed a fresh commit to GitHub.

### Sprint 0.1 — Stack Decisions
Finalized the tech stack: Svelte + Vite, Supabase + Google Auth, Cloudflare Pages, PWA, Vitest. Also defined a custom vibrant "dandy" colour palette instead of a generic dark theme.

### Sprint 0.2 — Svelte + Vite Migration
Migrated the vanilla JS app into a Svelte + Vite project. All logic modules (data, storage, mvw, export) are now ES modules in `src/lib/`. The UI is split into four Svelte components: WeekGrid, MvwChips, TasksSection, ReviewCard. Build compiles to 56KB JS (20KB gzipped). The old `app/` folder and `node server.js` are preserved for now and will be retired in Sprint 5 (Supabase).

### Sprint 10/11/12 — CRDT bug fix + GitHub sync wrap-up
Picked up a large chunk of pre-existing uncommitted work implementing Sprints 10-12 (StorageAdapter abstraction, LWW CRDT merge, offline sync queue, GitHub sync). Found and fixed a regression introduced by the Sprint 10 CRDT migration: `getState()` now stores `checked`/`tasks` entries as `{ value, updatedAt }` objects instead of plain booleans, but `mvw.js`, `export.js`, and `stats.js` were still doing truthy checks on the whole object (always true). Fixed all three to read `.value`.

Completed the last open Sprint 12 item — PAT storage. Implemented lightweight base64 obfuscation (`obfuscateToken`/`deobfuscateToken` in `storage.js`) so the GitHub PAT isn't stored as plain text in `localStorage`. This is explicitly **not encryption** (no passphrase, trivially decodable with script access) — appropriate for a single-user client-side app, but worth revisiting if multi-user/shared-device use ever becomes a goal.

Also added a show/hide toggle on the PAT field and inline setup instructions (link to GitHub's token-creation page with `repo` scope pre-filled) in the Settings Modal's Cloud Sync section.

`tests/mvw.test.js` used the old plain-boolean `checked`/`tasks` fixture shape and broke after the `.value` fix. Updated the fixture to `{ value, updatedAt }` to match what `getState()` now produces. All 8 tests pass.

Committed as `ac93db9`. Sprint 10, 11, and 12 are now fully complete and checked off in `sprints_v2Sync.md`. Next active sprint is Sprint 13 (Supabase "Dandy Sync" managed backend).

### Sprint 13 (part 1) — SupabaseAdapter, schema, RLS
Implemented the first task group of Sprint 13: `SupabaseAdapter` (`src/lib/sync/SupabaseAdapter.js`), `supabase/schema.sql`, and added `@supabase/supabase-js` as a dependency.

Design (see resolved Q7 in Questions.md): one shared Supabase project hosted by Kaushik, magic-link/Google OAuth per user, single `user_data` table (`user_id` PK referencing `auth.users`, `data jsonb`, `updated_at`) holding the same blob shape as `exportData()`/`importData()` — mirrors the GitHub adapter's single-file-per-account approach rather than normalizing into multiple tables. RLS policies restrict all access to `auth.uid() = user_id`.

Conflict detection mirrors GitHub's sha/409 approach: `set(payload, expectedUpdatedAt)` does a conditional `update ... where updated_at = expectedUpdatedAt`; zero rows affected throws `'409_CONFLICT'` (same string `SyncEngine.flush()` already checks for from `GitHubAdapter`).

`SupabaseAdapter` also includes `getUser()`, `signInWithMagicLink()`, `signOut()`, and `onAuthStateChange()` — needed because `get()`/`set()` depend on `auth.getUser()`. These aren't wired to any UI yet; that's Sprint 13's remaining "Authentication UI" task group (magic link login portal + sign-out in Settings, plus `SyncEngine` provider switching to actually use `supabaseAdapter`).

**Not done yet, blocks real testing:** no live Supabase project exists. `supabase/schema.sql` needs to be run in a real project's SQL editor, and `getSyncConfig().supabaseUrl`/`supabaseAnonKey` need a UI to be entered (next task group) before this adapter can be exercised end-to-end.

### Sprint 13.5 (part 1) — Auth + SyncEngine wiring
Completed the Auth task group of Sprint 13.5 (profile/avatar UI deferred to part 2, per user request — that's a bigger follow-up sprint).

- Renamed `GitHubAdapter`'s `sha`/`SupabaseAdapter`'s `updatedAt` to a common `version` field on `get()`/`set()` so `SyncEngine` can treat both providers identically (`this.cloudVersion`, `adapter.set(payload, this.cloudVersion)`).
- `SyncEngine.getAdapter(config)` now picks `githubAdapter` or `supabaseAdapter` based on `config.provider`, returning `null` (no-op sync) if not configured or not signed in — same "simulate delay, clear pending" path as before for GitHub.
- `SyncEngine.refreshAuthSubscription()` subscribes to `supabaseAdapter.onAuthStateChange`; on sign-in it triggers `hydrate()` (pulls + LWW-merges cloud state), on sign-out it clears `pending`. Called once at construction and again whenever the sync config changes (Settings modal's `$effect`), so it picks up a newly-entered Supabase URL/anon key.
- Settings modal: new "Dandy Sync (Supabase)" section — enable checkbox, Project URL + Anon Key (with show/hide toggle), then either a magic-link email form (signed out) or "Signed in as <email>" + Force Sync + Sign Out (signed in).

**Test fix:** `tests/touch.test.js` mocks `../src/lib/storage.js` entirely; since `SyncEngine`'s constructor now calls `getSyncConfig()` (via `supabaseAdapter.getClient()`) to set up the auth subscription, the mock needed a `getSyncConfig` export added (`provider: 'none'`) or module load failed. All 8 tests pass.

**Still not done (Sprint 13.5 part 2, separate session):** `profiles` table + RLS, `avatars` storage bucket + RLS, avatar upload/display, display-name editing UI. Also still blocked on a live Supabase project for end-to-end testing — `supabase/schema.sql` needs to be run, and email magic-link auth needs to be enabled in the project's Auth settings.

**Pre-existing, out of scope:** `exportData()`/`importData()` round-trip the entire `syncConfig` (including the GitHub PAT) through cloud sync. If a user signs into Dandy Sync on a second device with a different GitHub PAT configured, hydrating will overwrite it with the first device's PAT. Not introduced by this session, but worth a look if BYO-GitHub-sync and Dandy-Sync are ever used together.

### Sprint 13.5 (part 1 fix) — Hardcode Dandy Sync project credentials
Corrected a misalignment with the Q7 architecture decision: Dandy Sync is a single managed backend (one shared Supabase project hosted by Kaushik), so the Project URL/Anon Key must NOT be user-entered fields — only "Bring Your Own Sync" (GitHub) is per-user configured.

- Added `.env` (gitignored) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the live Dandy Sync project (`oqqtwzbkvcugftanhrxz`), plus `.env.example` as a template.
- `SupabaseAdapter` now reads `import.meta.env.VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` directly (memoized client, no per-config cache key needed).
- Removed `supabaseUrl`/`supabaseAnonKey` from `getSyncConfig()`/`saveSyncConfig()` in `storage.js`.
- `SyncEngine.getAdapter()` for `provider === 'supabase'` now just checks `supabaseAdapter.getUser()` - no config field check.
- Settings modal's "Dandy Sync (Supabase)" section now only shows the enable checkbox + magic-link sign-in/sign-out (no Project URL/Anon Key inputs or show/hide toggle).
- `tests/touch.test.js` mock simplified to drop the removed fields. All 8 tests pass.

**Still blocked on, for end-to-end testing:** confirm `supabase/schema.sql` has been run against the live project, and confirm Authentication → URL Configuration has Site URL `http://localhost:5173` + matching redirect URL.

### Session pause — status as of this commit
Stopped here at the user's request, with uncommitted working-tree changes (not yet committed):
- `.gitignore` — added `.env` and `secrets.md` (both untracked, contain real Supabase credentials/DB password — found an existing untracked `secrets.md` with the DB password during this session, now gitignored so it can't be committed by accident)
- `.env` (untracked, gitignored) — real `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` for the live Dandy Sync project
- `.env.example` (new, untracked) — template for the above
- `src/lib/sync/SupabaseAdapter.js`, `src/lib/storage.js`, `src/lib/sync/SyncEngine.js`, `src/components/SettingsModal.svelte`, `tests/touch.test.js` — the hardcode-credentials fix described above

All 8 Vitest tests pass. Dev server was started, verified responding on `localhost:5173`, then stopped.

**Next session should:**
1. Confirm `supabase/schema.sql` has been run in the live project's SQL editor and Auth URL Configuration (Site URL/Redirect URLs for `http://localhost:5173`) is set, then test the magic-link sign-in end-to-end.
2. If that works, commit the hardcode-credentials fix (when user asks for a commit).
3. Move to Sprint 13.5 part 2 (Profile Schema & Storage + Account UI - avatar upload, display name).
4. Q6 (`stats.js` `checkmarks`/`checked` mismatch) still open.

### Sprint 13.6 — Sync Correctness & History
Completed all four task groups from the post-13.5 audit:

- **Full history sync**: `storage.js` now exports/imports every `ls-week-*` entry (not just the current week). Extracted the CRDT-migration logic from `getState()` into a standalone `migrateWeekState()` so historical weeks pulled from `localStorage` get the same `{value, updatedAt}` normalization as the current week. `SyncEngine.hydrate()` now runs `mergeState()` over the union of local/cloud week keys, not just the current week.
- **Stats Dashboard fixes (Q6, now resolved)**: `getStats()` reads `state.checked` (was `state.checkmarks`, always undefined for real data) and matches tag completions on `session.id` (was `session.time`, a field that doesn't exist on sessions). Also handles legacy boolean `checked` entries alongside the CRDT `{value, updatedAt}` shape. `generateDummyStats()` updated to write the same `checked`/`{value, updatedAt}` shape and `${day.key}-${session.id}` keys as real data, so it no longer masks bugs like this in the future. Added `tests/stats.test.js` covering both shapes.
- **Sync config isolation**: `syncConfig` removed entirely from `exportData()`/`importData()`. Sync provider settings (`ls-sync-config` — provider, GitHub username/repo/PAT) are now purely per-device and never sent to GitHub or Supabase. This also closes a latent leak where `exportData()` returned the **plaintext** (deobfuscated) GitHub PAT, which would have ended up in the Supabase `user_data` jsonb blob or the synced GitHub repo file.
- **Docs**: `Architecture.md` rewritten (now "v2.0") to describe the local-first + optional cloud-sync model, fixed the stale "No Auth Required"/pure-localStorage framing, updated the weekly-snapshot example to the `checked`/CRDT shape, and added a "Sync (optional)" section describing the adapters.

All 10 Vitest tests pass (`npx vitest run`).

**Still pending from before:** confirm Supabase setup (schema.sql + Auth URL config) and test magic-link sign-in end-to-end; commit the Sprint 13.5 part-1-fix + Sprint 13.6 changes once verified.

### Settings UX revamp + Dandy Sync verification + WeekGrid Monday-first
Verified the live Supabase setup end-to-end: `schema.sql` is applied (`GET /rest/v1/user_data` returns 200 with the anon key) and email/magic-link auth is enabled (`auth/v1/settings` shows `email: true`). Magic-link sign-in was tested live and works.

While verifying, found that `user_data` had no row after sign-in. Root cause: `SyncEngine.hydrate()` only pulls from the cloud — if no row exists yet it did nothing, and "Force Sync Now" only calls `hydrate()`, never `flush()`. Fixed: `hydrate()` now pushes the local `exportData()` payload via `adapter.set()` to create the initial row when the cloud has none (`src/lib/sync/SyncEngine.js`).

Also did a Settings Modal UX pass (user-requested, ahead of Sprint 13.5 part 2): `src/components/SettingsModal.svelte` now shows a one-line sync status indicator (provider + connection state) under the header, and all sections are collapsible `<details>`/`<summary>` accordions. "Cloud Sync (GitHub)" and "Dandy Sync (Supabase)" were merged into a single "Sync" section with a radio-button provider picker (Off/GitHub/Dandy Sync) showing only the relevant sub-form.

Separately, fixed the WeekGrid day order: `src/components/WeekGrid.svelte` now sorts `days` Monday-first for display (`(jsDay + 6) % 7`), regardless of the underlying Friday-anchored storage order in `data.js`/`ls-schedule`. Only the "today" highlight moves day-to-day; the column order is now a fixed traditional Mon-Sun calendar layout.

Both committed as `c9d7801` (Settings UX + sync fix) — the WeekGrid Monday-first change is still uncommitted as of this note. All 10 Vitest tests pass.

**New sprint added:** Sprint 13.7 — Week Navigation (Plan Ahead), inserted between 13.6 and 14 in `sprints_v2Sync.md`. Lets users navigate back through past weeks and one week forward (for planning), with `◀ [Label · date range] ▶` navigation and offset-aware storage helpers. Not started.

**Next session should:** pick between Sprint 13.5 part 2 (Profile/Account UI - avatars, display name) or Sprint 13.7 (Week Navigation) - present both as options.

### Sprint 13.7 — Week Navigation (Plan Ahead)
Completed all task groups:

- `storage.js`: `getWeekKey`/`getWeekRange` now take an `offset` (weeks from the real current week, via a shared `getAnchorFriday(offset)` helper); `getState`/`saveState` take the same offset. New `getWeekLabel(offset)` returns "Last Week"/"This Week"/"Next Week" for -1/0/+1, else the date range.
- `store.svelte.js`: new `globalStore.weekOffset` (default 0), `saveGlobalState`/`reloadGlobalState` read/write via it, new `setWeekOffset(delta)` clamps forward navigation at +1 (unlimited back).
- `WeekGrid.svelte`: new `◀ [Label · date range] ▶` nav bar; navigating resets transient UI state (add/edit forms, drag/reorder); "today" highlight only shown at `weekOffset === 0`.
- `App.svelte`: header now shows `{weekLabel} · {weekRange}` for the viewed week.
- `ReviewCard.svelte`: hidden entirely when `weekOffset === 1` (can't review a week that hasn't happened).
- No changes needed to `exportData`/`hydrate`/`stats.js` - `getAllWeekKeys()` re-scans localStorage dynamically (picks up new future-week entries), and `stats.js` uses `getWeekKey()` with the default offset 0 (real current week), independent of navigation.

Added `tests/weekOffset.test.js` (Monday-anchor + year-boundary cases for the new offset helpers); updated `tests/touch.test.js`'s storage mock with `getWeekRange`/`getWeekLabel` stubs since `WeekGrid` now calls them at render. All 12 Vitest tests pass.

Added a small follow-up: clicking the center week-nav label (`.week-nav-label`) now calls `navigateToThisWeek()` to jump straight back to "This Week" when viewing a different week (no-op if already on offset 0). New `goToThisWeek()` in `store.svelte.js` resets `weekOffset`/`weekState` and shares the `resetWeekUiState()` cleanup with `navigateWeek()`. Added `.week-nav-label.clickable` hover styling in `app.css`. All 12 Vitest tests still pass.

**Follow-up fixes (same session, still uncommitted):**
- Fixed duplicate week label (e.g. "May 22 – May 28 · May 22 – May 28") for weeks with no special Last/This/Next label - `App.svelte` and `WeekGrid.svelte`'s nav bar now only show the date range if it differs from the label.
- **Schedule history correctness**: `storage.js`'s `saveState()` now keeps `scheduleSnapshot` in sync with the live `ls-schedule` template for the current week and next week (`offset >= 0`), but leaves a past week's snapshot frozen once set. `WeekGrid.svelte`'s `days` derived now reads `weekState.scheduleSnapshot` (falling back to the live schedule) when `weekOffset < 0`, so past weeks show what the schedule actually was that week, while this/next week always reflect live edits. "Edit schedule" is now disabled (with a tooltip) when viewing a past week, and `setWeekOffset` auto-exits edit mode when navigating into the past.
- Moved the sync status dot to the right of the settings cog (was between the title and Stats button) and shrank it (`font-size: 10px`, `min-height/width: 24px`); tooltip on hover unchanged.
- Also fixed a real data-loss bug: task/schedule/tag edits never called `schedulePush()`, so `hydrate()` on refresh could overwrite a freshly-added task with a stale cloud copy. `incrementScheduleVersion()` now pushes immediately, and `hydrate()` pushes any pending local edits before pulling.
- Added an early-access lock for Dandy Sync (single shared managed backend, open-source repo): `VITE_DANDY_SYNC_ALLOWED_EMAIL` env var gates magic-link sign-in client-side in `SupabaseAdapter.js`, and `supabase/lock_dandy_sync_email.sql` adds a Postgres `before insert on auth.users` trigger rejecting any other email - the real enforcement, since the anon key is public in the built app.

All committed and pushed as `209cc1c`. The user has run `lock_dandy_sync_email.sql` against the live Supabase project, so Dandy Sync sign-up is now restricted to the project owner's email.

**Drag-and-drop fixes (`WeekGrid.svelte`):**
- `moveReorder()`/`performMove()` called a leftover `onScheduleChange()` prop callback removed during the Sprint 1.5 runes refactor, throwing a `ReferenceError` on every reorder/move - replaced with `incrementScheduleVersion()`.
- The "item above goes semi-transparent" glitch was from imperative `classList` manipulation on `e.currentTarget` for the `.dragging` class; replaced with a `draggingKey` `$state` + reactive `isDragging` class binding.
- Fixed a fatal crash (white screen on refresh): `DEFAULT_DAYS` reuses session ids (e.g. `'stretch'`) across every day, so moving a session into a day that already has that id created a duplicate key in that day's keyed `{#each}`, which Svelte treats as fatal. Reverted the each-block key (not needed once `isDragging` no longer relies on DOM identity) and made `performMove` regenerate the moved session's id when the destination day already has a session with that id.

All verified via `npx vitest run` (12/12 passing).
