# Sprints

Logical sprint plan from current state → end-goal app. Each sprint is a self-contained unit of work that leaves the app in a shippable state. Sprints build on each other — do not skip ahead.

Each sprint lists the **Features** entries it delivers. Features are tagged with their sprint in `Features.md`.

Status legend: ✅ Done · 🔲 Not started · 🔄 In progress · ⏸ Blocked

---

## Sprint 0 — Dev Environment & Repo Hygiene
**Goal:** Clean, working development setup before any feature work. Everything from here runs in VSCode.
**Features delivered:** none — this is infrastructure only.

### Git / Repo
- [x] Delete the broken partial `.git` folder (open project in File Explorer → delete `.git` manually, or run `rmdir /s /q .git` in terminal)
- [x] Run `git init` in the project root from VSCode terminal
- [x] Run `git branch -M main`
- [x] Run `git config user.email "kaushikpaddy@gmail.com"` and `git config user.name "Kaushik"`
- [x] Run `git remote add origin https://github.com/Walabrolu4/Boy-Thats-a-Dandy-Schedule-.git`
- [x] Verify `.gitignore` excludes: `logs/`, `old/`, `docs/Handoff.md`, `node_modules/` — `.gitignore` created and verified
- [x] Stage all files: `git add -A`
- [x] First commit: `git commit -m "Initial commit: Boy, That's a Dandy Schedule!"`
- [x] Push: `git push -u origin main`
- [x] Verify files appear correctly on GitHub

### VSCode Setup
- [ ] Open the project folder in VSCode (`File → Open Folder`)
- [ ] Install recommended extensions: Prettier (formatting), Live Server (preview without Node), GitLens (git history)
- [x] Confirm `node server.js` runs and the app opens at `http://localhost:3131` — server confirmed working
- [x] Delete `git-setup.bat` — no longer needed once git is configured

### Housekeeping
- [x] Move any stray planning `.md` files from the project root into `docs/` or `old/` — root only contains `README.md`
- [x] Confirm `docs/` folder has all expected files: README, Rationale, Features, Architecture, Sprints, prompt, Notes, Questions — all present
- [x] Make sure root `README.md` accurately describes how to run the app — written and accurate

---

## Sprint 0.1 — Stack Research & Analysis
**Goal:** Evaluate and decide the full technology stack before any feature code is written. The output is a written decision document (`docs/StackDecision.md`) that may update Features.md and Sprints.md. All future sprints depend on this being settled.
**Features delivered:** none — this is research and planning only.

> ⚠️ This sprint produces decisions, not code. Do not write any application code during this sprint. Every subsequent sprint assumes the stack has been chosen.

### What needs to be decided

The current app is vanilla HTML/CSS/JS + a local Node server. The end goals are:
- Cross-device sync (phone, Mac, Windows)
- Mobile-usable
- Installable (home screen)
- No ongoing cost for a single user
- DMS-branded, feels like a real product

The following decisions must be made before Sprint 0.5 begins.

### Research — Frontend Approach
- [x] **Option A — Stay vanilla JS:** no build step, no framework, extend current architecture. Simple but manual DOM work scales poorly as features grow.
- [x] **Option B — Add Svelte (via Vite):** introduces a build step but eliminates all manual `render()` calls. Reactive state replaces `state.js`. Small bundle, gentle learning curve.
- [x] **Option C — Add Vue (via Vite):** similar to Svelte, slightly more verbose, larger ecosystem.
- [x] **Option D — React:** most ecosystem support, heavier, more boilerplate than needed for this scope.
- [x] For each option, answer: Does it change the no-npm server constraint? Does it require learning a new mental model? How much of the existing code carries forward?
- [x] **Decide and document:** which frontend approach, and why.

### Research — Build Tool
- [x] **Option A — No build tool (current):** `<script src="">` tags, file:// compatible, zero config. Adding a framework requires one.
- [x] **Option B — Vite:** fastest build tool available, minimal config, native ES modules in dev, excellent for Svelte/Vue/vanilla. Would require serving via `vite dev` instead of `node server.js` during development.
- [x] Consider: does adding a build step add meaningful friction to the vibe-coding workflow?
- [x] **Decide and document:** build tool or not, and why.

### Research — Backend / Sync
- [x] **Supabase (current plan):** hosted Postgres + auth + realtime. Free tier: 500MB, pauses after 1 week inactivity. SDK works directly from browser JS. No server needed.
- [x] **Firebase / Firestore:** Google's equivalent. Free Spark plan. NoSQL (easier for this data shape than Postgres). No project pause on inactivity. More vendor lock-in.
- [x] **PocketBase:** self-hosted, single binary, SQLite-backed. Free if hosted on a cheap VPS (~$5/mo). More control, more ops work.
- [x] **Convex:** reactive database, free tier, built-in sync and functions. More opinionated.
- [x] For each: free tier longevity, offline-first support, complexity of SDK, auth story.
- [x] **Decide and document:** which backend, and why.

### Research — Auth Strategy
- [x] **Magic link email (Supabase/Firebase built-in):** passwordless, no account setup friction. Requires email access.
- [x] **Google OAuth:** one-tap sign-in, familiar. Requires OAuth app setup in Google Console.
- [x] **No auth (device-only):** skip auth entirely, use a device-specific UUID as the key. Simpler, but no true cross-device sync.
- [x] Consider: this is a single-user personal tool. Is full auth worth the complexity?
- [x] **Decide and document:** auth approach, and why.

### Research — Hosting
- [x] **Cloudflare Pages:** Integrates beautifully with Vite builds and is incredibly fast globally.
- [x] **Vercel:** free tier, deploys from GitHub push, environment variables, HTTPS automatic. Best fit if using Vite build.
- [x] **GitHub Pages:** free, static only, no environment variables.
- [x] Consider: Supabase anon key is public-safe.
- [x] **Decide and document:** hosting, and why.

### Research — PWA vs Native vs Hybrid
- [x] **PWA (current plan):** no app store, installable via browser, works offline via service worker. Free. Some iOS Safari limitations.
- [x] **Tauri:** true native binary, tiny size, Rust backend. Requires Rust toolchain, no mobile support yet (Tauri v2 has experimental mobile).
- [x] **Capacitor:** wraps a web app in a native shell, deploys to iOS/Android App Store. Requires Apple Developer ($99/yr) and/or Google Play ($25 one-time). Heavy setup.
- [x] Consider: the primary install targets are phone home screen and maybe desktop. PWA covers both for free. App Store distribution is not a stated goal.
- [x] **Decide and document:** distribution approach, and why.

### Research — Testing Framework
- [x] **Node built-in `node:test`:** no npm, stable since Node 18. Limited features but sufficient for pure logic tests.
- [x] **Vitest:** pairs naturally with Vite, fast, supports browser-mode for DOM testing. Requires npm.
- [x] **Jest:** most widely used, large ecosystem, works without a bundler. Requires npm.
- [x] Consider: if we're adding a build step for the frontend anyway, adding a test dependency (Vitest) costs nothing extra.
- [x] **Decide and document:** test framework, and why.

### Output — Stack Decision Document
- [x] Create `docs/StackDecision.md` with the following sections:
  - **Chosen stack** (one-liner summary table: Frontend / Build / Backend / Auth / Hosting / Distribution / Testing)
  - **Decision rationale** for each choice (2–4 sentences each)
  - **What changes in the plan** — list any sprints or features that need to be updated based on the decisions
  - **Risks and open questions** — anything still uncertain
- [x] Review `docs/Features.md` — update or add features if the chosen stack introduces new requirements or removes old ones (e.g. if Vite is added, note it in Architecture section)
- [x] Review `docs/Sprints.md` — update sprint steps if the chosen stack changes the approach (e.g. if Vitest replaces `node:test`, update Sprint 0.5 accordingly)
- [x] Update `docs/Questions.md` — mark any questions resolved by this research; add new ones if decisions raised further questions
- [x] Add a note to `docs/Notes.md` summarising the chosen stack and the key reasons
- [x] Commit: `git commit -m "Sprint 0.1: Stack research and decision"`
- [x] Push to GitHub

---

## Sprint 0.2 — Svelte + Vite Migration
**Goal:** Replace the vanilla JS `<script>` tag architecture with Vite + Svelte. The app looks and works identically — this sprint is purely structural.
**Features delivered:** `Migrate frontend to Svelte + Vite build step` (Architecture section)

### Project Setup
- [x] Create `package.json` with Vite, Svelte, and Vitest as dev dependencies
- [x] Create `vite.config.js`
- [x] Create root `index.html` (Vite entry point, replaces `app/index.html`)
- [x] Run `npm install` — packages installed cleanly
- [x] Add `node_modules/` and `dist/` to `.gitignore`

### Source Files
- [x] Create `src/main.js` — Svelte entry point
- [x] Create `src/app.css` — CSS copied verbatim from `app/css/main.css`
- [x] Create `src/lib/data.js` — constants with ES module exports
- [x] Create `src/lib/storage.js` — localStorage helpers with ES module exports
- [x] Create `src/lib/mvw.js` — MVW calculation logic as ES module
- [x] Create `src/lib/export.js` — weekly review export as ES module (callback-based for Svelte)
- [x] Create `public/` folder and copy `dms_logo_temp.png` into it

### Svelte Components
- [x] Create `src/App.svelte` — root shell: header, buttons, layout
- [x] Create `src/components/MvwChips.svelte` — MVW chip row
- [x] Create `src/components/WeekGrid.svelte` — 7-day grid, sessions, drag-and-drop, add/edit forms
- [x] Create `src/components/TasksSection.svelte` — unscheduled tasks with add/remove
- [x] Create `src/components/ReviewCard.svelte` — collapsible weekly review panel

### Verification
- [x] `npm run build` — 118 modules, ✓ built in 966ms, no errors
- [x] Old `app/` folder preserved — `node server.js` still works as fallback until Sprint 5
- [x] Commit: `git commit -m "Sprint 0.2: Svelte + Vite migration"`
- [x] Push to GitHub

---

## Sprint 0.5 — Unit Tests
**Goal:** A test suite covering all pure logic functions. Tests run before every commit. No npm required — uses Node's built-in `node:test` module.
**Features delivered:** Testing & Quality section in `Features.md`

> Run this sprint before any feature work. Tests lock in correct behaviour so that future sprints have a safety net.

### Test Infrastructure
- [ ] `npm install -D vitest`
- [ ] Update `package.json` to include `"test": "vitest"` script
- [ ] Create `tests/` folder in the project root
- [ ] Ensure Vitest runs and discovers tests
- [ ] Add a comment block explaining how to add new test files

### Tests — `storage.js` (date helpers)
- [ ] Create `tests/storage.test.js`
- [ ] Test `getWeekKey()`: given a known date (mock `Date`), assert the returned key is `ls-week-YYYY-MM-DD` for the correct most-recent Friday
- [ ] Test `getWeekKey()` on a Friday — assert the key is for that same Friday (not the previous one)
- [ ] Test `getWeekKey()` on a Thursday — assert the key is for the Friday 6 days prior
- [ ] Test `getWeekRange()`: assert the returned string format matches `"Mon DD – Mon DD"` and spans exactly 7 days
- [ ] Test `getWeekRange()` returns a range starting on Friday and ending on Thursday

### Tests — `mvw.js` (MVW calculation)
- [ ] Create `tests/mvw.test.js`
- [ ] Stub `getSchedule()` and `getMVWConfig()` with fixture data for these tests (do not rely on localStorage)
- [ ] Test: no sessions checked → all chips show 0, all `done: false`
- [ ] Test: 5 stretch sessions checked → stretch chip `done: true`
- [ ] Test: 4 stretch sessions checked → stretch chip `partial: true`, `done: false`
- [ ] Test: exercise checked twice → `done: true` (target is 2)
- [ ] Test: exercise checked once → `partial: true`
- [ ] Test: micro draw session checked → `drawDone` remains false (micro doesn't count)
- [ ] Test: non-micro draw session checked → `drawDone: true`
- [ ] Test: custom type added with MVW target of 1 → chip appears and counts correctly

### Tests — `server.js` (upsert logic)
- [ ] Create `tests/server.test.js`
- [ ] Extract `upsertWeekSection()` from `server.js` into a separately importable function (or test it via `require`)
- [ ] Test: empty file → writes new content with file header
- [ ] Test: file with no matching week → appends new section at the end
- [ ] Test: file with matching week header → replaces only that section, leaves other weeks intact
- [ ] Test: matching week is the last section (no trailing `## Week of`) → replaces to end of file correctly
- [ ] Test: matching week is in the middle of multiple weeks → neighbouring weeks are untouched

### Review & QA
- [ ] Run `node tests/run.js` — all tests pass with green output
- [ ] Run `test.bat` — verify it works as a double-click launcher
- [ ] Deliberately break one function (e.g. change a threshold in `mvw.js`) — confirm a test fails and points to the right line
- [ ] Revert the deliberate break — confirm tests go green again
- [ ] Update `docs/Architecture.md` to document the `tests/` folder and the test runner
- [ ] Commit: `git commit -m "Sprint 0.5: Unit test suite"`
- [ ] Push to GitHub

---

## Sprint 1 — DMS Branding & UI Polish
**Goal:** The app looks and feels like a DMS product. Colours, animations, and visual polish locked in before structural feature work.
**Features delivered:** Branding / DMS UI Update section · Animations on session check-off · Typography review

> ⚠️ Do this sprint before Supabase migration — you don't want to re-skin after a major refactor.

### Define the DMS Colour Palette
- [ ] Document the DMS brand colours (hex values) in a comment block at the top of `main.css` as CSS variables
- [ ] Identify: primary accent, background base, surface/card colour, border colour, text primary, text secondary, success green, warning orange
- [ ] Replace all current hardcoded colour values in `main.css` with the CSS variables
- [ ] Verify dark theme still reads correctly with new palette
- [ ] Replace `dms_logo_temp.png` with final DMS logo asset in `app/` and update the `<img>` src in `index.html`

### Typography
- [ ] Confirm Pacifico (title) pairs well with current body font under DMS palette
- [ ] If not, select a complementary body font from Google Fonts and add the `<link>` to `index.html`
- [ ] Adjust `font-size`, `line-height`, and `letter-spacing` on body text to match DMS feel
- [ ] Review all button labels, chip text, and section headings for consistency

### Animations
- [ ] **Session check-off:** CSS transition on the session block when `.done` class is applied — subtle scale + colour fill, ~150ms ease-out
- [ ] **MVW chip completion:** when a chip transitions from partial → done, pulse animation (scale 1 → 1.08 → 1)
- [ ] **Page load:** fade-in the `.app` container (CSS `@keyframes` fadeIn, opacity 0 → 1 over 300ms)
- [ ] **Add session form:** slide down when it opens (max-height transition or translateY)
- [ ] **Edit form:** same slide-in as add form
- [ ] **Drag ghost:** `.dragging` class uses slight rotation + reduced opacity matching brand feel
- [ ] **Drop zone highlight:** `.drop-col` and `.drop-before`/`.drop-after` use brand accent colour
- [ ] **Saved flash:** `#savedFlash` and `#exportFlash` styled as DMS toast notifications (rounded, subtle background, smooth fade)

### Button & Interactive States
- [ ] Audit all buttons — ensure hover, active, and focus states exist and use brand colours
- [ ] Edit mode button has clear active/inactive visual distinction in brand colours
- [ ] Micro toggle active state uses brand accent (update from current orange if needed)
- [ ] Dev reset button remains visually distinct (dashed border, updated to brand colour)

### Tests
- [ ] Sprint 1 introduces no new pure logic — no new test files needed
- [ ] Run `node tests/run.js` — confirm all existing tests still pass after CSS/DOM changes

### Review & QA
- [ ] Open the app and walk through every interaction — check for visual regressions
- [ ] Screenshot desktop view and review against DMS brand reference
- [ ] Commit: `git commit -m "Sprint 1: DMS branding and UI polish"`
- [ ] Push to GitHub

---

## Sprint 2 — Mobile View
**Goal:** The app is fully usable on a phone browser. All features accessible, no horizontal scroll, touch-friendly.
**Features delivered:** Mobile view (UI / Polish section)

> Do this before Supabase — you need to know the mobile layout before building the login/auth screens.

### Layout — Responsive Grid
- [ ] Verify `<meta name="viewport" content="width=device-width, initial-scale=1.0">` is in `index.html`
- [ ] Define mobile breakpoint in `main.css` at `max-width: 600px`
- [ ] Change `.week-grid` from 7-column horizontal to single-column stacked on mobile
- [ ] Each day column becomes a full-width card on mobile
- [ ] Collapse/hide empty days on mobile (days with no sessions show a minimal placeholder)
- [ ] `.header` stacks vertically on mobile — title above, buttons below
- [ ] `.mvw-chips` wraps onto multiple lines (`flex-wrap: wrap`)
- [ ] `.review-card` and `.tasks-section` are full-width on mobile, padding reduced

### Touch Targets
- [ ] All button minimum tap targets 44×44px on mobile (`min-height`, `min-width`)
- [ ] Session blocks have adequate padding for reliable tap vs. checkbox distinction
- [ ] Edit (✎) and delete (×) buttons increased to at least 28px on mobile
- [ ] Type picker buttons in add/edit forms — increased size and spacing on mobile

### Drag-and-Drop → Touch Reorder
- [ ] HTML5 drag-and-drop does not work on mobile — add a touch alternative
- [ ] Long-press (500ms) on a session block enters "reorder mode" for that session
- [ ] Reorder mode shows up ↑ / down ↓ arrow buttons to move within the day
- [ ] "Move to day" dropdown for cross-day moves
- [ ] Desktop drag-and-drop unchanged — touch path is additive
- [ ] Exit reorder mode on tap outside or after a move

### Navigation
- [ ] Sticky day-of-week tab bar at top that scrolls to the relevant day card on tap
- [ ] "Jump to today" button scrolls to current day card on mobile

### Forms
- [ ] Add session form — verify keyboard doesn't obscure input on mobile
- [ ] Review textarea expands correctly on mobile and doesn't overflow viewport
- [ ] All inputs use appropriate `type` attributes for mobile keyboards

### Tests
- [ ] Create `tests/touch.test.js`
- [ ] Test long-press timer logic: assert that a 500ms hold triggers reorder mode and a short tap does not
- [ ] Test `performMove()` (from `drag.js`) still works correctly — reorder via touch uses the same move function as drag-and-drop
- [ ] Run `node tests/run.js` — all tests pass

### Review & QA
- [ ] Test on actual phone browser (Chrome Android or Safari iOS)
- [ ] Test in Chrome DevTools at 375px (iPhone SE) and 390px (iPhone 14)
- [ ] Walk through: add session, check off session, write review, save
- [ ] Commit: `git commit -m "Sprint 2: Mobile responsive layout and touch reorder"`
- [ ] Push to GitHub

---

## Sprint 3 — Custom MVW Targets
**Goal:** User can set their own Minimum Viable Week thresholds.
**Features delivered:** Custom MVW targets · Per-session MVW opt-out (MVW section)

### Data Model
- [ ] Define `ls-mvw-config` localStorage key:
  ```js
  {
    stretch:  { target: 5, outOf: 7 },
    meditate: { target: 5, outOf: 7 },
    prog:     { target: 1 },
    draw:     { target: 1 },
    keys:     { target: 1 },
    exer:     { target: 2, outOf: 3 }
  }
  ```
- [ ] Add `getMVWConfig()` and `saveMVWConfig()` to `storage.js`
- [ ] Defaults match current hardcoded values (no behaviour change on first load)

### Logic Update
- [ ] Refactor `getMVW()` in `mvw.js` to read from `getMVWConfig()` instead of hardcoded numbers
- [ ] Verify existing chip logic still works after refactor
- [ ] Verify partial states calculate correctly from config

### UI — MVW Settings Panel
- [ ] "Edit targets" button near MVW chip row
- [ ] Opens inline panel below chip row (not a modal)
- [ ] One row per MVW item: label, current target, +/− controls
- [ ] Count-based targets show `target / outOf` with separate +/− for each
- [ ] Boolean targets (prog, draw, keys) show on/off toggle
- [ ] "Done" closes panel and calls `render()`
- [ ] Changes auto-save to `ls-mvw-config` immediately
- [ ] Panel accessible in both normal and edit mode

### Dev Reset
- [ ] `devReset()` also clears `ls-mvw-config`

### Tests
- [ ] Update `tests/mvw.test.js` to test against custom config values (not just defaults)
- [ ] Add test: custom target of 7/7 stretch → chip only `done` when all 7 are checked

### Review & QA
- [ ] Run `node tests/run.js` — all tests pass
- [ ] Set stretch to 7/7 — chip reflects new goal
- [ ] Set exercise to 3/3 — partial states work at 1 and 2
- [ ] Toggle prog off — chip disappears
- [ ] Dev reset — targets return to defaults
- [ ] Commit: `git commit -m "Sprint 3: Custom MVW targets"`
- [ ] Push to GitHub

---

## Sprint 4 — Custom Session Types / Tags
**Goal:** User can create, rename, and delete their own session types beyond the 5 built-in ones.
**Features delivered:** Custom session types · Rename types · Colour picker per type (Session Management section)

### Data Model
- [ ] Define `ls-types` localStorage key:
  ```js
  [
    { id: 'prog',   label: 'Programming',     colour: '#...' },
    { id: 'draw',   label: 'Drawing',          colour: '#...' },
    { id: 'keys',   label: 'Keyboard / Music', colour: '#...' },
    { id: 'exer',   label: 'Exercise',         colour: '#...' },
    { id: 'anchor', label: 'Daily anchor',     colour: '#...' },
  ]
  ```
- [ ] Add `getTypes()` and `saveTypes()` to `storage.js`
- [ ] `getTypes()` falls back to 5 built-in defaults if `ls-types` is empty
- [ ] Replace hardcoded `TYPES` and `LEGEND_ITEMS` in `data.js` with calls to `getTypes()`

### Dynamic Type Picker
- [ ] Refactor type picker in `render.js` to read from `getTypes()` instead of hardcoded HTML
- [ ] Each type button uses its stored `colour` for selected state
- [ ] Legend below grid rendered dynamically from `getTypes()`

### Type Management UI
- [ ] "Manage types" button in edit mode
- [ ] Opens inline types management panel
- [ ] Each type shows: coloured dot, label, rename button, delete button
- [ ] Rename: clicking label makes it editable inline; Enter or blur saves
- [ ] Delete: confirmation with "X sessions use this type — reassign to:" dropdown
- [ ] Add new type: label input + `<input type="color">` colour picker + add button
- [ ] New types get generated ID `custom-{timestamp}`
- [ ] All changes update `ls-types` and trigger `render()`

### MVW Integration
- [ ] When custom type added, prompt "Add to MVW?" toggle
- [ ] If yes, adds entry to `ls-mvw-config` with `target: 1`
- [ ] When type deleted, removes its entry from `ls-mvw-config`

### Dev Reset
- [ ] `devReset()` also clears `ls-types`

### Tests
- [ ] Add `tests/types.test.js`
- [ ] Test: `getTypes()` with empty localStorage returns the 5 defaults
- [ ] Test: saved custom type survives a `getTypes()` round-trip
- [ ] Test: deleting a type and reassigning removes it from the type list

### Review & QA
- [ ] Run `node tests/run.js` — all tests pass
- [ ] Add custom type "Yoga" — appears in type picker, legend, and can be assigned to sessions
- [ ] Rename "Programming" to "Coding" — existing sessions still display correctly
- [ ] Delete custom type and reassign — no orphaned sessions
- [ ] Commit: `git commit -m "Sprint 4: Custom session types and tags"`
- [ ] Push to GitHub

---

## Sprint 5 — Supabase Backend
**Goal:** Data lives in the cloud. The app works on any device. Local Node server is retired.
**Features delivered:** Cloud sync · Offline-first sync · Review export to Supabase (Persistence + Weekly Review sections)

> This is the biggest sprint. Read the Supabase docs before starting: https://supabase.com/docs

### Supabase Project Setup
- [ ] Create a free Supabase project at https://supabase.com
- [ ] Store project URL and anon key in `config.js` (gitignored)
- [ ] Add `config.js` to `.gitignore` immediately
- [ ] Add `config.example.js` with placeholder values

### Database Schema
- [ ] Create table `schedules`: `id`, `user_id`, `data` (jsonb), `updated_at`
- [ ] Create table `week_states`: `id`, `user_id`, `week_key` (text), `data` (jsonb), `updated_at`
- [ ] Create table `tasks`: `id`, `user_id`, `data` (jsonb), `updated_at`
- [ ] Create table `mvw_config`: `id`, `user_id`, `data` (jsonb), `updated_at`
- [ ] Create table `types`: `id`, `user_id`, `data` (jsonb), `updated_at`
- [ ] Create table `reviews`: `id`, `user_id`, `week_key` (text), `week_range` (text), `content` (text), `updated_at`
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Write RLS policies: `auth.uid() = user_id` for all tables

### Authentication
- [ ] Add Supabase JS SDK via CDN in `index.html`
- [ ] Create `app/js/auth.js` — add to script load order after `storage.js`
- [ ] Implement `initSupabase()`, `signIn()` (magic link), `signOut()`, `getUser()`
- [ ] Minimal login screen shown when `getUser()` returns null
- [ ] On successful auth, hide login screen and render app
- [ ] Display user email + sign-out button in header

### Offline-First Sync Strategy
- [ ] localStorage remains source of truth for reads
- [ ] On app load: if online + authenticated, fetch from Supabase and merge into localStorage (Supabase wins)
- [ ] On every save: write localStorage first (instant), then Supabase async
- [ ] If Supabase write fails (offline), queue and retry on next load
- [ ] Sync status indicator in header (synced ✓ / syncing… / offline)

### Migrate Storage Functions
- [ ] Add `syncSchedule()` / `pushSchedule()` — Supabase ↔ localStorage
- [ ] Add `syncWeekState()` / `pushWeekState()`
- [ ] Add `syncTasks()` / `pushTasks()`
- [ ] Add `syncMVWConfig()` / `pushMVWConfig()`
- [ ] Add `syncTypes()` / `pushTypes()`
- [ ] Update all `saveX()` functions to call `pushX()` after localStorage write

### Migrate Weekly Review Export
- [ ] Update `export.js` — replace `fetch('/api/save-review')` with Supabase upsert on `reviews`
- [ ] Upsert key: `(user_id, week_key)`
- [ ] Remove `server.js` and `start.bat` once confirmed working
- [ ] Update `README.md` — remove Node server instructions

### Tests
- [ ] Update `tests/server.test.js` → rename to `tests/review.test.js` and update to test the new Supabase upsert logic (mock the Supabase client)
- [ ] Create `tests/sync.test.js`
- [ ] Test offline queue: assert that a failed push adds an item to the queue and that `retryQueue()` re-attempts it
- [ ] Test sync merge: if Supabase data has a newer `updated_at` than localStorage, Supabase data wins
- [ ] Test sync merge: if localStorage is newer, it is pushed to Supabase rather than overwritten
- [ ] Test `getUser()` returns null when not authenticated
- [ ] Run `node tests/run.js` — all tests pass

### Review & QA
- [ ] Sign in on desktop — verify data loads
- [ ] Make a change — verify it appears on a second device after refresh
- [ ] Check a session on mobile — verify syncs to desktop
- [ ] Go offline — app still works from localStorage
- [ ] Come back online — queued writes sync
- [ ] Sign out and back in — data persists
- [ ] Commit: `git commit -m "Sprint 5: Supabase auth and cross-device sync"`
- [ ] Push to GitHub

---

## Sprint 6 — PWA (Installable App)
**Goal:** Installable to home screen on iOS and Android. No browser chrome, works offline.
**Features delivered:** PWA manifest + service worker (Architecture section)

### Web App Manifest
- [ ] Create `app/manifest.json` with name, short_name, start_url, display: standalone, icons
- [ ] Create app icons at 192×192 and 512×512 using DMS branding
- [ ] Add `<link rel="manifest">` to `index.html`
- [ ] Add `<meta name="theme-color">` to `index.html`
- [ ] Add Apple-specific meta tags for iOS install

### Service Worker
- [ ] Create `app/sw.js`
- [ ] Install event: cache all static assets
- [ ] Fetch event: cache-first strategy
- [ ] Activate event: delete old caches on version bump
- [ ] Register in `app.js` with `navigator.serviceWorker.register`
- [ ] Test: app loads fully with network disabled in DevTools

### Hosting
- [ ] Connect GitHub repo to Cloudflare Pages
- [ ] Set build command to `npm run build` and output directory to `dist`
- [ ] Add Supabase env vars in Cloudflare dashboard
- [ ] Confirm deployed URL loads and syncs correctly
- [ ] Update `README.md` with live URL

### Tests
- [ ] Create `tests/sw.test.js`
- [ ] Test cache version string — assert that bumping `CACHE` version in `sw.js` causes the activate event to delete the old cache key
- [ ] Test asset list completeness — assert that every JS file in `app/js/` is present in the `ASSETS` array in `sw.js` (prevents silent cache misses after adding new files)
- [ ] Run `node tests/run.js` — all tests pass

### Install Testing
- [ ] Android Chrome: install prompt appears → standalone launch works
- [ ] iOS Safari: Add to Home Screen → standalone launch works
- [ ] Offline: app loads from cache, localStorage data intact
- [ ] Online reconnect: sync resumes

### Review & QA
- [ ] Lighthouse PWA audit — aim 90+ score
- [ ] Fix any failing Lighthouse checks
- [ ] Commit: `git commit -m "Sprint 6: PWA manifest, service worker, Vercel deploy"`
- [ ] Push to GitHub

---

## Sprint 7 — Power Features
**Goal:** Quality-of-life features for long-term use.
**Features delivered:** View past reviews · Seasonal re-mapping · Task notes · Task reordering (Weekly Review + Unscheduled Tasks sections)

### View Past Weekly Reviews
- [ ] "Past reviews" button in weekly review panel header
- [ ] Inline panel listing previous weeks from Supabase `reviews` table
- [ ] Each past week collapsible: week range → full review content
- [ ] Review markdown rendered as formatted HTML
- [ ] MVW completion chips per past week

### Seasonal Schedule Re-mapping
- [ ] "New season" button in header (edit mode or gear icon)
- [ ] Step 1: pick available days
- [ ] Step 2: app suggests slot assignment based on available days
- [ ] Step 3: user confirms or adjusts
- [ ] On confirm: applies new schedule, archives old one as snapshot in Supabase

### Unscheduled Task Enhancements
- [ ] Optional note/description field per task (expandable inline)
- [ ] Drag-to-reorder for tasks (HTML5 drag on desktop, long-press on mobile)

### Tests
- [ ] Create `tests/reviews.test.js`
- [ ] Test past reviews fetch: mock Supabase response with 3 past week entries — assert all 3 are returned sorted newest-first
- [ ] Test review markdown render: given a known markdown string, assert the output HTML contains the expected headings and list items
- [ ] Create `tests/seasonal.test.js`
- [ ] Test slot suggestion logic: given a set of available days, assert the suggested assignment puts prog on the two busiest days and exercise is spread
- [ ] Test schedule archive: assert that triggering a new season saves the old schedule as a snapshot before overwriting
- [ ] Run `node tests/run.js` — all tests pass

### Review & QA
- [ ] Navigate to past week — loads correctly
- [ ] Run through seasonal re-mapping flow end-to-end
- [ ] Commit: `git commit -m "Sprint 7: Past reviews, seasonal re-mapping, task enhancements"`
- [ ] Push to GitHub

---

## Sprint 8 — Stats & Analytics
**Goal:** Create a visual dashboard to track adherence and habit trends over time.
**Features delivered:** A dedicated "Stats" page with charts for goal completion rates and session adherence.

### Data Aggregation
- [x] Create `lib/stats.js` to process historical `ls-week-*` data from `localStorage`.
- [x] Calculate overall completion percentages for weekly goals (Minimum Viable Week).
- [x] Calculate adherence percentages for scheduled sessions over time.

### Visualizations
- [x] Add `chart.js` or a similar charting library.
- [x] Create `src/components/StatsDashboard.svelte`.
- [x] Build a line chart showing goal completion trends across past weeks.
- [x] Build a bar chart or radar chart showing which specific tags/habits are most frequently missed or completed.

### Navigation
- [x] Add a "📊 Stats" button to the main header or Settings modal to open the dashboard.

---

## Sprint 9 — Final Polish & Launch
**Goal:** v1.0. Bug-free, fully documented, shareable.
**Features delivered:** All remaining accessibility, performance, and doc items.

### Bug Bash
- [x] Full walkthrough: desktop Chrome
- [x] Full walkthrough: mobile Safari (iPhone)
- [x] Full walkthrough: mobile Chrome (Android)
- [x] Fresh account test (no existing data) — defaults load correctly
- [x] Dev reset — complete wipe and clean reload
- [x] Offline → online sync cycle end-to-end

### Docs Update
- [x] Update `Architecture.md` to reflect Supabase schema and final structure
- [x] Update `Features.md` — mark all completed items ✅
- [x] Update `README.md` with live URL and final setup instructions
- [x] Update `Handoff.md` with final state

### Performance & Accessibility
- [x] Lighthouse audit — target 90+ across Performance, Accessibility, Best Practices, PWA
- [x] Compress all image assets
- [x] Verify `font-display: swap` on all fonts
- [x] All interactive elements have visible focus states
- [x] All buttons have `aria-label` where needed
- [ ] Colour contrast passes WCAG AA (4.5:1)
- [ ] App navigable by keyboard alone

### Launch
- [ ] Run `node tests/run.js` — all tests pass
- [ ] Tag: `git tag v1.0.0` and `git push origin v1.0.0`
- [ ] Verify Vercel deployment is live
- [ ] Share the URL

---

## Backlog (Post v1.0)

- [ ] Tauri + Svelte desktop rewrite
- [ ] Shareable schedule — read-only link for accountability partners
- [ ] Streak tracking across weeks
- [ ] Export weekly reviews as formatted PDF
- [ ] Browser push notification reminders
- [ ] Multi-schedule support (switch between season schedules without losing history)
