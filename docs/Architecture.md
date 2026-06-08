# Architecture

Current state of the app as of June 2026.

---

## Overview

A vanilla HTML/CSS/JS single-page app served by a minimal Node.js HTTP server. No framework, no build step, no npm dependencies. All JS files share a single global scope via plain `<script>` tags — this avoids ES module CORS issues when serving over `file://`.

```
Learning and Art planning/
├── app/
│   ├── index.html          ← shell: markup only, no inline JS or CSS
│   ├── css/
│   │   └── main.css        ← all styles including dark mode
│   └── js/
│       ├── data.js         ← constants (DEFAULT_DAYS, DEFAULT_TASKS, TYPES, LEGEND_ITEMS)
│       ├── storage.js      ← localStorage read/write helpers
│       ├── state.js        ← mutable UI state variables (global)
│       ├── mvw.js          ← Minimum Viable Week calculation
│       ├── drag.js         ← HTML5 drag-and-drop handlers
│       ├── edit.js         ← add / edit / remove session & task handlers
│       ├── render.js       ← full DOM rebuild (render())
│       ├── app.js          ← top-level event handlers + bootstrap
│       └── export.js       ← weekly review save to file via server
├── server.js               ← Node.js HTTP server (no npm)
├── start.bat               ← Windows launcher
├── logs/                   ← generated at runtime, gitignored
│   └── weekly-reviews.md
└── docs/                   ← this folder
```

---

## Script Load Order

Order matters because all scripts share global scope:

```
data.js → storage.js → state.js → mvw.js → drag.js → edit.js → render.js → app.js → export.js
```

Each file depends on globals exposed by the files before it. Adding a new file must respect this chain.

---

## Data Model

### Schedule (structure)
Stored in `localStorage` under key `ls-schedule`. Persists across weeks.

```js
[
  {
    key: 'fri',          // unique day identifier
    label: 'Fri',        // display label
    jsDay: 5,            // Date.getDay() value
    sessions: [
      {
        id: 'stretch',   // unique within a day (used as drag/drop key)
        label: 'Stretch',
        type: 'anchor',  // 'anchor' | 'prog' | 'draw' | 'keys' | 'exer' | 'review'
        note: 'morning',
        micro: false     // optional, defaults to false
      }
    ]
  }
]
```

### Week State
Stored in `localStorage` under key `ls-week-YYYY-MM-DD` (date = most recent Friday). Resets each Friday.

```js
{
  checked: {
    'fri-stretch': true,   // key = `${dayKey}-${sessionId}`
    'sat-prog1': true,
  },
  tasks: {
    'reading': true,       // key = task id
  },
  review: {
    q1: 'string',          // Which sessions didn't happen?
    q2: 'string',          // Where did I get stuck?
    q3: 'string',          // One thing to protect next week
  }
}
```

### Tasks (non-scheduled)
Stored in `localStorage` under key `ls-tasks`.

```js
[
  { id: 'reading', label: 'Reading', note: '...' }
]
```

---

## Key Modules

### `data.js`
Pure constants. No functions. Defines `DEFAULT_DAYS`, `DEFAULT_TASKS`, `TYPES`, `LEGEND_ITEMS`. Only referenced when localStorage has no saved state (first run or after dev reset).

### `storage.js`
All localStorage access lives here. Key functions:
- `getWeekKey()` — returns `ls-week-YYYY-MM-DD` for the most recent Friday
- `getWeekRange()` — human-readable range string (e.g. "Jun 6 – Jun 12")
- `getSchedule()` / `saveSchedule(days)` — schedule structure
- `getState()` / `saveState(s)` — week state, includes migration from old `reading` key
- `getTasks()` / `saveTasks(tasks)` — task list

### `state.js`
Mutable global variables for UI state. Not persisted. Set directly by edit/drag handlers:
- `editMode` — whether edit controls are visible
- `activeAddDay` — which day's add form is open
- `pendingType` / `pendingMicro` — type/micro selection in the add form
- `editingSession` — `{ dayKey, sessionId }` of the session being edited inline
- `editingType` / `editingMicro` — values in the edit form
- `taskFormOpen` — whether the add-task form is visible

### `mvw.js`
`getMVW(state)` iterates all days/sessions by type (not hardcoded IDs), returns an array of chip objects `{ label, done, partial }`. Thresholds are currently hardcoded here:
- Stretch: 5/7, Meditate: 5/7
- Prog/Draw/Keys: 1 full session (micro doesn't count)
- Exercise: 2/3

### `drag.js`
HTML5 drag-and-drop. A single `dragState` object tracks `{ dayKey, sessionId }` of the dragged item. On drop, `performMove()` mutates the schedule array and calls `saveSchedule()` then `render()`.

### `edit.js`
All add/edit/remove functions. Inline session editing works by setting `editingSession` in state, then calling `render()` — the render function inserts the edit form in place of the session block when `editingSession` matches.

### `render.js`
`render()` rebuilds the entire DOM from scratch on each call. No virtual DOM. Updates: weekLabel, mvwChips, weekGrid, tasksSection, legend, review checkbox state.

### `export.js`
`saveWeeklyReview()` POSTs `{ weekRange, content }` to the local server (`/api/save-review`). `buildWeekSection()` generates the Markdown string. Requires `server.js` to be running.

---

## Server (`server.js`)

Pure Node.js — `http`, `fs`, `path` only. No npm.

- **Static file serving:** serves `app/` directory at `http://localhost:3131`
- **POST `/api/save-review`:** receives `{ weekRange, content }`, calls `upsertWeekSection()` which finds the existing week header in `logs/weekly-reviews.md` and replaces it in-place, or appends a new entry

---

## Week Boundary

The week runs **Friday → Thursday**. `getWeekKey()` finds the most recent Friday by walking back from today using `(today.getDay() + 2) % 7`. This means the app's "week" matches the user's psychological week — it resets after Thursday evening review.

---

## Known Limitations / Next Steps

- MVW thresholds are hardcoded in `mvw.js` — custom targets require refactoring this into user config
- Session types are hardcoded in `data.js` and `render.js` — custom tags require a type registry
- No authentication — single-user, local only
- Saving reviews requires the Node server running — planned migration to Supabase
- No mobile layout — UI is desktop-only at current widths
