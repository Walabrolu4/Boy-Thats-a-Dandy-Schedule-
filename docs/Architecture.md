# System Architecture (v2.0)

## Overview
"Now that's a Dandy Routine!" is a client-side PWA built with Svelte 5, `localStorage` as the primary data engine, and optional cloud sync layered on top.

## Core Philosophies
1. **Zero Latency**: Data is instantly available on load.
2. **Offline-First**: Users can plan their week, check off boxes, and review their history entirely offline. `localStorage` is always the source of truth on a given device.
3. **No Auth Required by Default**: The app works out of the box with zero friction. Auth (Supabase magic link) is only needed if the user opts into "Dandy Sync" for cross-device sync.
4. **PWA Native**: The app is installable on iOS and Android devices, mimicking native app behavior.

## Technologies Used
- **Framework**: Svelte 5 (Vite)
- **Styling**: Vanilla CSS with custom properties (`var(--purple)`)
- **Storage**: Browser `localStorage` (primary), optionally mirrored to a cloud backend via `StorageAdapter`
- **Cloud Sync (optional)**: `GitHubAdapter` (Bring Your Own Sync - private repo + PAT) or `SupabaseAdapter` ("Dandy Sync" - managed backend, magic-link auth) - see `src/lib/sync/`
- **Analytics**: `chart.js` + `svelte-chartjs`
- **PWA**: `vite-plugin-pwa` for service worker generation and caching

## Data Model (Local Storage)

The entire application state is stored as serialized JSON strings in `localStorage` under specific keys.

### 1. `ls-schedule`
An array of objects representing the "Minimum Viable Week".
```json
[
  {
    "key": "mon",
    "label": "Monday",
    "sessions": [
      { "id": "t1", "time": "8:00 AM", "label": "Morning Lift", "tagId": "fitness" }
    ]
  }
]
```

### 2. `ls-tags`
An array defining the overarching goals and their brand colors.
```json
[
  { "id": "fitness", "label": "Stay Fit", "color": "#3DD68C" }
]
```

### 3. Weekly Snapshots (`ls-week-YYYY-MM-DD`)
Every week, a new key is generated based on the Friday start date (e.g. `ls-week-2026-06-05`). It contains the live state of that week's checkboxes, tasks, and the end-of-week review answers.
Crucially, it also attaches a `scheduleSnapshot` to freeze the layout of the schedule during that specific week, ensuring historical accuracy in Analytics even if the user completely remaps their schedule later.

`checked` and `tasks` entries are CRDTs (`{ value, updatedAt }`) so they can be merged Last-Write-Wins across devices - see Sync below.
```json
{
  "checked": { "mon-s1": { "value": true, "updatedAt": 1717000000000 } },
  "tasks": { "read_book": { "value": true, "updatedAt": 1717000000000 } },
  "review": { "q1": "Great week", "q2": "", "q3": "" },
  "scheduleSnapshot": [...]
}
```

## Analytics Pipeline
The `src/lib/stats.js` module iterates over `localStorage`, grabs all `ls-week-*` keys, and aggregates completed sessions against the `scheduleSnapshot` to output adherence percentage (0-100%) and habit breakdown.

## Sync (optional)
`src/lib/sync/` implements a `StorageAdapter` abstraction with three implementations:
- `LocalStorageAdapter` - the default, always-on local engine described above
- `GitHubAdapter` - "Bring Your Own Sync": reads/writes a single JSON file (the full `exportData()` payload) to a private GitHub repo using a user-supplied PAT
- `SupabaseAdapter` - "Dandy Sync": a managed backend (one shared Supabase project, RLS by `auth.uid()`, magic-link sign-in) storing the same payload in a `user_data` table

`SyncEngine` debounces local changes, pushes the full `exportData()` payload (all `ls-week-*` weeks plus tags/tasks/schedule/theme) to whichever adapter is configured, and on hydrate merges each week's `checked`/`tasks` CRDTs with `mergeState()` (LWW by `updatedAt`). Sync provider configuration (`ls-sync-config`: which provider, GitHub username/repo/PAT) is per-device and is never included in the synced payload.

## Build & Deploy
- `npm run dev`: Starts Vite hot-reload server.
- `npm run build`: Compiles Svelte components, generates the `dist/` folder, and creates the Service Worker `sw.js`.
- The `dist/` contents can be statically deployed to Vercel, Netlify, or GitHub Pages.
