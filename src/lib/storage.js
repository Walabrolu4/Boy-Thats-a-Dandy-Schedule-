// ── localStorage helpers ───────────────────────────────────────────────────
// Two separate keys:
//   'ls-schedule'         → schedule structure (days + sessions); persists across weeks
//   'ls-week-YYYY-MM-DD'  → per-week state (checkmarks, tasks, review text)
//
// The week key is always the date of the most recent Friday (week starts Fri).

import { DEFAULT_DAYS, DEFAULT_TASKS } from './data.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

// Returns the localStorage key for the current week, e.g. 'ls-week-2026-06-06'
export function getWeekKey() {
  const today = new Date();
  const daysBack = (today.getDay() + 2) % 7; // distance back to most recent Friday
  const friday = new Date(today);
  friday.setDate(today.getDate() - daysBack);
  return `ls-week-${friday.getFullYear()}-${pad(friday.getMonth() + 1)}-${pad(friday.getDate())}`;
}

// Returns a human-readable range string, e.g. 'Jun 6 – Jun 12'
export function getWeekRange() {
  const today = new Date();
  const daysBack = (today.getDay() + 2) % 7;
  const friday = new Date(today);
  friday.setDate(today.getDate() - daysBack);
  const thursday = new Date(friday);
  thursday.setDate(friday.getDate() + 6);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(friday)} – ${fmt(thursday)}`;
}

// ── Non-scheduled tasks ──

export function getTasks() {
  const raw = localStorage.getItem('ls-tasks');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(DEFAULT_TASKS));
}

export function saveTasks(tasks) {
  localStorage.setItem('ls-tasks', JSON.stringify(tasks));
}

// ── Schedule (structure) ──

export function getSchedule() {
  const raw = localStorage.getItem('ls-schedule');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(DEFAULT_DAYS)); // deep clone of defaults
}

export function saveSchedule(days) {
  localStorage.setItem('ls-schedule', JSON.stringify(days));
}

// ── Week state (checkmarks, tasks, review) ──

export function getState() {
  const raw = localStorage.getItem(getWeekKey());
  if (raw) {
    try {
      const s = JSON.parse(raw);
      // Migrate old state.reading → state.tasks.reading
      if (!s.tasks) {
        s.tasks = s.reading ? { reading: true } : {};
        delete s.reading;
      }
      return s;
    } catch (e) { /* fall through */ }
  }
  return { checked: {}, tasks: {}, review: { q1: '', q2: '', q3: '' } };
}

export function saveState(s) {
  localStorage.setItem(getWeekKey(), JSON.stringify(s));
}
