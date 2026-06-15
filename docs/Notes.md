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
