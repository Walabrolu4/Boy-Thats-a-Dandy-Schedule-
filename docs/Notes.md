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
