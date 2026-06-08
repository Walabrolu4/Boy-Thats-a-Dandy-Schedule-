# Features

Status legend: ✅ Done · 🔲 Planned · 🔄 In progress
Sprint tag: `→ Sprint X` indicates which sprint delivers the feature.

---

## Stack Research & Planning

- ✅ Evaluate and decide frontend approach (vanilla JS vs Svelte vs Vue vs React) `→ Sprint 0.1`
- ✅ Evaluate and decide build tool (none vs Vite) `→ Sprint 0.1`
- ✅ Evaluate and decide backend/sync (Supabase vs Firebase vs PocketBase vs Convex) `→ Sprint 0.1`
- ✅ Evaluate and decide auth strategy (magic link vs OAuth vs no-auth) `→ Sprint 0.1`
- ✅ Evaluate and decide hosting (Vercel vs GitHub Pages vs Netlify vs Cloudflare) `→ Sprint 0.1`
- ✅ Evaluate and decide distribution (PWA vs Tauri vs Capacitor) `→ Sprint 0.1`
- ✅ Evaluate and decide testing framework (node:test vs Vitest vs Jest) `→ Sprint 0.1`
- ✅ `docs/StackDecision.md` produced, Features and Sprints updated to reflect chosen stack `→ Sprint 0.1`

---

## Testing & Quality

- 🔲 Unit test suite for pure logic functions using Vitest `→ Sprint 0.5`
- 🔲 Test runner script (`npm run test`) `→ Sprint 0.5`
- 🔲 Tests run and pass before every commit `→ Sprint 0.5`

---

## Core Schedule

- ✅ 7-day weekly grid (Fri → Thu)
- ✅ Session blocks per day with label, type, note
- ✅ Drag-and-drop reordering of sessions within and across days
- ✅ Default order: Stretch first, Meditate last per day
- ✅ Week date range in header updates automatically based on real date
- ✅ Current day highlighted in grid

---

## Session Management

- ✅ Add sessions to any day (label, type, note)
- ✅ Inline session editing (label, type, note, micro toggle)
- ✅ Remove sessions
- ✅ Micro session toggle — faded appearance, does not count toward MVW
- ✅ Edit mode toggle with visual indicator
- 🔲 Custom session types / tags — user-defined beyond the 5 built-in types `→ Sprint 4`
- 🔲 Edit and rename existing session types / tags (e.g. rename "prog" to "code") `→ Sprint 4`
- 🔲 Colour picker per type / tag `→ Sprint 4`

---

## Minimum Viable Week (MVW)

- ✅ MVW chip row — live status of each target as sessions are checked off
- ✅ Partial completion state (e.g. Exercise 1/3 shown as partial chip)
- ✅ Type-based counting — custom/renamed sessions count by type, not hardcoded ID
- ✅ Non-scheduled tasks appear as MVW chips automatically
- 🔲 Custom MVW targets — user sets their own thresholds `→ Sprint 3`
- 🔲 Per-session MVW opt-out — mark a specific session as not counting toward any MVW target `→ Sprint 3`

---

## Unscheduled Tasks

- ✅ Dynamic task list (add / remove tasks)
- ✅ Tasks tracked as done/not-done per week
- ✅ Tasks appear as MVW chips
- 🔲 Task notes / description field `→ Sprint 7`
- 🔲 Task reordering `→ Sprint 7`

---

## Persistence

- ✅ Schedule structure saved to localStorage (persists across sessions)
- ✅ Per-week state (checkmarks, tasks, review) saved to localStorage
- ✅ Week key resets automatically each Friday
- ✅ Auto-save review text to localStorage (debounced, no manual step)
- 🔲 Cloud sync via Supabase — same data across devices `→ Sprint 5`
- 🔲 Offline-first with sync-on-reconnect `→ Sprint 5`

---

## Weekly Review

- ✅ Collapsible review panel
- ✅ Three reflection questions (why sessions missed, blockers, what to protect)
- ✅ Auto-save to localStorage as you type
- ✅ Save to `logs/weekly-reviews.md` via local Node server
- ✅ Upsert logic — re-saving the same week updates the entry rather than duplicating it
- ✅ Review export includes: sessions completed, unscheduled tasks, MVW status, reflection answers
- 🔲 View past weeks' reviews in-app `→ Sprint 7`
- 🔲 Review export to Supabase instead of local file (cross-device) `→ Sprint 5`

---

## Architecture / Developer

- ✅ Modular JS (current state)
- ✅ Local Node.js server (`server.js`) for file writes
- 🔲 Migrate frontend to Svelte + Vite build step `→ Sprint 0.2` (New Sprint before Supabase)
- 🔲 Unit test suite (Vitest) `→ Sprint 0.5`
- 🔲 Migrate from local server to Supabase backend `→ Sprint 5`
- 🔲 PWA manifest + service worker (installable, offline support) `→ Sprint 6`
- 🔲 Deploy to Cloudflare Pages `→ Sprint 6`

---

## UI / Polish

- ✅ "Boy, That's a Dandy Schedule!" branding with Pacifico font
- ✅ Dark theme
- ✅ Scheduled / Unscheduled section headings
- ✅ Session type legend
- ✅ Saved flash confirmation on auto-save and file save
- 🔲 Mobile view — responsive layout, touch-friendly tap targets, stacked grid, touch reorder `→ Sprint 2`
- 🔲 Animations on session check-off `→ Sprint 1`
- 🔲 Seasonal schedule re-mapping flow `→ Sprint 7`

---

## Branding / DMS UI Update

- 🔲 Define and apply DMS colour palette `→ Sprint 1`
- 🔲 DMS logo integrated properly in footer (replace `dms_logo_temp.png` with final asset) `→ Sprint 1`
- 🔲 Session check-off animation `→ Sprint 1`
- 🔲 MVW chip completion animation `→ Sprint 1`
- 🔲 Page load animation / entrance transition `→ Sprint 1`
- 🔲 Drag-and-drop visual polish (ghost element, drop zone highlight matching brand) `→ Sprint 1`
- 🔲 Button and interactive element hover/active states consistent with DMS style `→ Sprint 1`
- 🔲 Typography review — Pacifico + body font pairing `→ Sprint 1`
