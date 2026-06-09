# System Architecture (v1.0)

## Overview
"Now that's a Dandy Routine!" is a lightweight, purely client-side PWA built with Svelte 5.
After initial deliberation, the project shifted from a traditional client-server database model (Supabase) to a fully localized, offline-first approach using `localStorage` as the primary data engine.

## Core Philosophies
1. **Zero Latency**: Data is instantly available on load.
2. **Offline-First**: Users can plan their week, check off boxes, and review their history entirely offline.
3. **No Auth Required**: The app works out of the box with zero friction.
4. **PWA Native**: The app is installable on iOS and Android devices, mimicking native app behavior.

## Technologies Used
- **Framework**: Svelte 5 (Vite)
- **Styling**: Vanilla CSS with custom properties (`var(--purple)`)
- **Storage**: Browser `localStorage`
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
```json
{
  "checkmarks": { "mon-8:00 AM": true },
  "tasks": { "read_book": true },
  "review": { "q1": "Great week", "q2": "", "q3": "" },
  "scheduleSnapshot": [...]
}
```

## Analytics Pipeline
The `src/lib/stats.js` module iterates over `localStorage`, grabs all `ls-week-*` keys, and aggregates completed sessions against the `scheduleSnapshot` to output adherence percentage (0-100%) and habit breakdown. 

## Build & Deploy
- `npm run dev`: Starts Vite hot-reload server.
- `npm run build`: Compiles Svelte components, generates the `dist/` folder, and creates the Service Worker `sw.js`.
- The `dist/` contents can be statically deployed to Vercel, Netlify, or GitHub Pages.
