# 🌸 Now that's a Dandy Routine!

A personal weekly learning tracker and habits planner. Plan your sessions, track completions, hit your minimum viable week goals, and write reflections — all completely locally in your browser.

## Features

- **Offline-First PWA:** Install it on your phone or desktop. Everything runs locally with zero latency.
- **Drag-and-Drop:** Easily reorder your scheduled sessions across days.
- **Minimum Viable Week:** Track your high-level goals (e.g. 3 workouts/week) dynamically as you check off sessions.
- **Seasonal Remapping:** Easily mass-migrate your schedule when life changes.
- **Analytics:** Visualize your historical habit adherence and goal completion with beautiful charts.
- **Data Export:** Export your entire history to JSON and import it on any device.

## Setup & Development

Requires [Node.js](https://nodejs.org/).

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```
   This compiles the Svelte 5 application and generates the offline service worker in the `dist` folder, which can be deployed to any static host (GitHub Pages, Netlify, Vercel).

## Architecture
Built with **Svelte 5** and **Vite**. All user state is strictly maintained in the browser's `localStorage`, prioritizing speed, privacy, and simplicity over complex backend sync.
