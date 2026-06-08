# 🌸 Boy, That's a Dandy Schedule!

A personal weekly learning tracker. Plan your sessions, track completions, hit your minimum viable week, and write a reflection — all saved locally.

## Features

- Drag-and-drop session reordering across days
- Minimum viable week (MVW) chip tracker
- Micro session support (faded, doesn't count toward MVW)
- Inline session editing (label, type, note, micro)
- Dynamic unscheduled tasks (e.g. reading, side projects)
- Weekly review with auto-save to localStorage
- Save review to `logs/weekly-reviews.md` — updates existing entries in place

## Setup

Requires [Node.js](https://nodejs.org/).

```
node server.js
```

Then open [http://localhost:3131](http://localhost:3131).

Or double-click `start.bat` on Windows.

## Structure

```
app/
  index.html
  css/main.css
  js/
    data.js       # default schedule & constants
    storage.js    # localStorage helpers
    state.js      # UI state variables
    mvw.js        # minimum viable week logic
    drag.js       # drag-and-drop handlers
    edit.js       # add/edit/remove session handlers
    render.js     # DOM rendering
    app.js        # top-level handlers & bootstrap
    export.js     # weekly review save to file
server.js         # local HTTP server + save-review API
logs/             # generated — weekly-reviews.md saved here
```
