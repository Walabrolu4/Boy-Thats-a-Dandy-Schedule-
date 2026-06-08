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
