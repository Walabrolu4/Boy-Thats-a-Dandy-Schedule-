# Questions

Open questions and decisions requiring human review or research.

Format:
- `open` — not yet answered
- `resolved` — answered, see status line for the answer

---

### Q1: DMS brand colours
**Context:** Sprint 1 requires the exact DMS hex colour palette to apply to the app. The current dark theme uses generic neutrals.
**Options:** Provide hex values for: primary accent, background base, surface/card, border, text primary, text secondary, success, warning.
**Needed from:** human — Kaushik to supply the DMS brand colours before Sprint 1 begins.
**Status:** resolved — A vibrant retro-modern "dandy" palette (corals, deep slates, pastel accents) has been defined in StackDecision.md.

---

### Q2: Frontend framework preference
**Context:** Sprint 0.1 research must choose between staying vanilla JS or adopting a framework (Svelte recommended). This affects every future sprint. Vanilla is simpler but the current `render()` approach will become a maintenance burden as features grow.
**Options:**
- A) Stay vanilla JS — no new learning, current code carries forward as-is
- B) Svelte + Vite — introduce a build step, replace manual DOM work with reactive state, cleaner long-term
- C) Vue or React — similar to Svelte but heavier
**Needed from:** human — Kaushik's appetite for learning Svelte vs staying in familiar territory.
**Status:** resolved — Option B (Svelte + Vite). It replaces manual DOM work with reactive state.

---

### Q3: Auth preference
**Context:** Cross-device sync requires some form of user identity. This is a single-user personal tool so the question is how much friction is acceptable at login.
**Options:**
- A) Magic link email — passwordless, no setup friction, requires email access each time on new device
- B) Google OAuth — one tap, stays logged in, requires OAuth app setup
- C) No auth — use a device UUID as the key, simpler but not true cross-device sync
**Needed from:** human — how do you want to sign in?
**Status:** resolved — Google OAuth (via Supabase), as it is completely free on their tier.

---

### Q4: Is App Store distribution ever a goal?
**Context:** PWA covers phone home screen install for free. Capacitor adds true App Store distribution but costs $99/yr (Apple) and significant setup time. If App Store is never a goal, PWA is clearly the right call and Capacitor can be dropped from consideration entirely.
**Options:**
- A) No App Store ever — PWA is sufficient
- B) Maybe someday — note it in backlog but don't build for it now
- C) Yes, it's a goal — needs to factor into the architecture decision now
**Needed from:** human.
**Status:** resolved — No, PWA (hosted web page) is sufficient.

---

### Q5: Acceptable to add npm / a build step?
**Context:** The current app has zero npm dependencies by design (avoids toolchain complexity). Adding Vite + Svelte (or any framework) introduces `package.json`, `node_modules`, and a build command. This is standard for modern web apps but is a change to the workflow.
**Options:**
- A) Fine — `npm install` and `npm run dev` is acceptable
- B) Prefer to avoid it — keep the zero-dependency approach
**Needed from:** human.
**Status:** resolved — Yes, an npm build step is acceptable for the benefits of Vite/Svelte.

---

### Q7: Is "Dandy Sync" (Sprint 13) a shared multi-user Supabase backend, or BYO Supabase?
**Context:** `sprints_v2Sync.md` frames Sprint 13 as "the frictionless, paid-tier managed sync solution" with a magic-link login portal and sign-out flow — this is ambiguous between (a) one Supabase project hosted by Kaushik, with RLS isolating each signed-in user's rows, vs (b) each user bringing their own Supabase project/keys (parallel to the GitHub BYO-sync from Sprint 12), vs (c) single-tenant (just Kaushik, magic link as cross-device convenience only).
**Options:**
- A) Shared backend, magic link per-user (multi-tenant, RLS by `auth.uid()`)
- B) Bring your own Supabase project
- C) Single-tenant, just for Kaushik
**Needed from:** human.
**Status:** resolved — Option A. One shared Supabase project (hosted by Kaushik), magic-link/Google OAuth sign-in, RLS policies isolate each user's rows by `auth.uid()`. This positions "Dandy Sync" as a real multi-user product tier alongside the free GitHub BYO-sync option from Sprint 12.

---

### Q6: `stats.js` reads `state.checkmarks` but saved data uses `state.checked`
**Context:** While fixing the Sprint 10 CRDT regression, found that `getStats()` in `src/lib/stats.js` (line ~35) reads historical week data via `state.checkmarks`, but `getState()`/`saveState()` in `storage.js` store sessions under `state.checked`. This looks like a pre-existing bug from Sprint 8 (Stats Dashboard) — `state.checkmarks` is always `undefined` for real saved weeks, so `checkedCount` and `tagCompletions` are likely always 0 in the historical adherence stats. The `tasks` completion count (line ~52) was fixed as part of this session's CRDT work, but the `checkmarks`/`checked` mismatch is separate and was left untouched to keep this session's scope to Sprint 10-12.
**Options:**
- A) Fix now as a quick follow-up (rename `state.checkmarks` → `state.checked` in `stats.js`, verify against real saved week data)
- B) File as a Sprint 8.5 / backlog bug fix for a dedicated session
**Needed from:** human — confirm whether historical adherence % currently looks wrong in the Stats Dashboard (would confirm this bug is live) and whether to fix now or later.
**Status:** resolved — Fixed in Sprint 13.6: `stats.js` now reads `state.checked` and matches tag completions on `session.id`. Covered by `tests/stats.test.js`.
