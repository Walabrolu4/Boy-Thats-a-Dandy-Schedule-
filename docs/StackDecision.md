# Stack Decision

**Chosen Stack:**

| Layer | Choice |
|---|---|
| Frontend | Svelte |
| Build Tool | Vite |
| Backend & Sync | Supabase (Free Tier) |
| Authentication | Google OAuth (via Supabase) |
| Hosting | Cloudflare Pages |
| Distribution | PWA (Progressive Web App) |
| Testing | Vitest |

## Decision Rationale

- **Frontend & Build (Svelte + Vite):** Svelte replaces manual DOM manipulation with reactive state variables and component architecture while keeping a very simple, HTML-like syntax. Vite provides an instant-update local dev server and compiles Svelte for the browser.
- **Backend & Sync (Supabase):** Provides Postgres, real-time sync, and auth out-of-the box. Its generous free tier is perfect for a single-user app.
- **Authentication (Google OAuth):** One-tap login with zero setup friction for the user on new devices. Free via Supabase.
- **Hosting (Cloudflare Pages):** Integrates seamlessly with Vite builds, incredibly fast global CDN, and free.
- **Distribution (PWA):** Meets all requirements for home screen installation and offline support without the overhead or cost of App Store distribution (Tauri/Capacitor).
- **Testing (Vitest):** Because we are adopting Vite, Vitest is the natural, native testing framework that works out-of-the-box with Svelte.

## DMS Brand Palette (Vibrant Retro-Modern)

Instead of a generic theme, we will use a "dandy" vibe.
- **Primary Accent:** `#FF6B6B` (Vibrant Coral/Salmon)
- **Background Base:** `#1A1B26` (Deep Slate/Navy)
- **Surface/Card:** `#24283B` (Lighter Slate)
- **Text Primary:** `#C0CAF5` (Soft Blue-White)
- **Text Secondary:** `#565F89` (Muted Indigo)
- **Success Green:** `#9ECE6A` (Pastel Lime)
- **Warning Orange:** `#E0AF68` (Warm Gold)

## Changes to the Plan

- Sprint 0.5 (Testing) will now use Vitest instead of Node's built-in `node:test`.
- Sprint 1 (Branding) will implement the palette defined above.
- Sprint 5 (Supabase) will use Google OAuth instead of Magic Link.
- Sprint 6 (PWA) will deploy to Cloudflare Pages instead of Vercel.
