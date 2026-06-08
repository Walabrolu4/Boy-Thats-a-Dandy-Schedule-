# Notes

Running log of decisions, context, and things to remember across sessions.

---

### Sprint 0 — Repo Hygiene
Completed git initialization, deleted old partial repo, and force-pushed a fresh commit to GitHub.

### Sprint 0.1 — Stack Decisions
Finalized the tech stack: Svelte + Vite, Supabase + Google Auth, Cloudflare Pages, PWA, Vitest. Also defined a custom vibrant "dandy" colour palette instead of a generic dark theme.

### Sprint 0.2 — Svelte + Vite Migration
Migrated the vanilla JS app into a Svelte + Vite project. All logic modules (data, storage, mvw, export) are now ES modules in `src/lib/`. The UI is split into four Svelte components: WeekGrid, MvwChips, TasksSection, ReviewCard. Build compiles to 56KB JS (20KB gzipped). The old `app/` folder and `node server.js` are preserved for now and will be retired in Sprint 5 (Supabase).
