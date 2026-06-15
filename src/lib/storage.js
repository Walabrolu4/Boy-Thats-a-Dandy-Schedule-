// ── localStorage helpers ───────────────────────────────────────────────────
// Two separate keys:
//   'ls-schedule'         → schedule structure (days + sessions); persists across weeks
//   'ls-week-YYYY-MM-DD'  → per-week state (checkmarks, tasks, review text)
//
// The week key is always the date of the most recent Friday (week starts Fri).

import { DEFAULT_DAYS, DEFAULT_TASKS } from './data.js';
import { localStoreAdapter } from './sync/LocalStorageAdapter.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

// Returns the Friday anchoring the week at `offset` weeks from the current one
// (offset 0 = this week, -1 = last week, +1 = next week, etc.)
function getAnchorFriday(offset = 0) {
  const today = new Date();
  const daysBack = (today.getDay() + 2) % 7; // distance back to most recent Friday
  const friday = new Date(today);
  friday.setDate(today.getDate() - daysBack + offset * 7);
  return friday;
}

// Returns the localStorage key for the week at `offset` weeks from the current one,
// e.g. 'ls-week-2026-06-06'
export function getWeekKey(offset = 0) {
  const friday = getAnchorFriday(offset);
  return `ls-week-${friday.getFullYear()}-${pad(friday.getMonth() + 1)}-${pad(friday.getDate())}`;
}

// Returns a human-readable range string, e.g. 'Jun 6 – Jun 12'
export function getWeekRange(offset = 0) {
  const friday = getAnchorFriday(offset);
  const thursday = new Date(friday);
  thursday.setDate(friday.getDate() + 6);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(friday)} – ${fmt(thursday)}`;
}

// Returns "Last Week" / "This Week" / "Next Week" for offset -1/0/+1,
// otherwise just the date range.
export function getWeekLabel(offset = 0) {
  if (offset === -1) return 'Last Week';
  if (offset === 0) return 'This Week';
  if (offset === 1) return 'Next Week';
  return getWeekRange(offset);
}

// Whether a week has a saved `ls-week-*` entry (i.e. real historical data).
// The current week (offset 0) always counts as existing, even before its
// first save.
export function hasWeekData(offset = 0) {
  if (offset === 0) return true;
  return localStoreAdapter.getSync(getWeekKey(offset)) !== null;
}

// ── Non-scheduled tasks ──

export function getTasks() {
  const data = localStoreAdapter.getSync('ls-tasks');
  if (data) return data;
  return JSON.parse(JSON.stringify(DEFAULT_TASKS));
}

export function saveTasks(tasks) {
  localStoreAdapter.setSync('ls-tasks', tasks);
}

// ── Schedule (structure) ──

export function getSchedule() {
  const data = localStoreAdapter.getSync('ls-schedule');
  if (data) return data;
  return JSON.parse(JSON.stringify(DEFAULT_DAYS)); // deep clone of defaults
}

export function saveSchedule(days) {
  localStoreAdapter.setSync('ls-schedule', days);
}

// ── Week state (checkmarks, tasks, review) ──

// CRDT Migration: convert flat boolean flags to { value, updatedAt } objects.
// Applies to any week's state, not just the current week, so historical
// weeks pulled in for export/sync are also normalized.
function migrateWeekState(s) {
  if (!s.tasks) {
    s.tasks = s.reading ? { reading: true } : {};
    delete s.reading;
  }
  if (!s.checked) s.checked = {};

  const now = Date.now();
  for (const [key, val] of Object.entries(s.checked)) {
    if (typeof val === 'boolean') s.checked[key] = { value: val, updatedAt: now };
  }
  for (const [taskId, val] of Object.entries(s.tasks)) {
    if (typeof val === 'boolean') s.tasks[taskId] = { value: val, updatedAt: now };
  }

  return s;
}

// Returns every 'ls-week-*' key currently in localStorage.
function getAllWeekKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('ls-week-')) keys.push(key);
  }
  return keys;
}

export function getState(offset = 0) {
  let s = localStoreAdapter.getSync(getWeekKey(offset));
  if (!s) {
    s = { checked: {}, tasks: {}, review: { q1: '', q2: '', q3: '' } };
  }
  return migrateWeekState(s);
}

export function saveState(s, offset = 0) {
  // Current/future weeks track the live schedule/task lists as they're edited;
  // past weeks keep whatever snapshot they last had (a frozen historical record).
  if (offset >= 0 || !s.scheduleSnapshot) s.scheduleSnapshot = getSchedule();
  if (offset >= 0 || !s.tasksSnapshot) s.tasksSnapshot = getTasks();
  localStoreAdapter.setSync(getWeekKey(offset), s);
}

// ── Onboarding ──

export function isOnboarded() {
  return localStorage.getItem('ls-onboarded') === 'true';
}

export function markOnboarded() {
  localStorage.setItem('ls-onboarded', 'true');
}

// True only for a genuinely fresh install: the onboarding flag isn't set and
// no schedule/tags/week data exists yet (so a second device hydrating an
// existing cloud account - which writes those keys via importData before
// this is checked - won't be prompted again).
export function shouldShowOnboarding() {
  if (isOnboarded()) return false;
  if (localStorage.getItem('ls-schedule') || localStorage.getItem('ls-tags')) return false;
  return getAllWeekKeys().length === 0;
}

// ── Theme ──

export function getTheme() {
  return localStorage.getItem('ls-theme') || 'purple';
}

export function saveTheme(theme) {
  localStorage.setItem('ls-theme', theme);
}

// ── Tags ──

export function getTags() {
  const raw = localStorage.getItem('ls-tags');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(DEFAULT_TAGS));
}

// Need a synchronous getTags for initial render without await
import { DEFAULT_TAGS } from './data.js';
export function getTagsSync() {
  const raw = localStorage.getItem('ls-tags');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(DEFAULT_TAGS));
}

export function saveTags(tags) {
  localStoreAdapter.setSync('ls-tags', tags);
}

// ── Sync Config ──

// Lightweight obfuscation so the PAT isn't sitting as plain text in localStorage.
// This is NOT encryption - anyone with script access to the page can decode it -
// but it avoids the token being trivially readable in a localStorage dump or screen-share.
function obfuscateToken(token) {
  if (!token) return '';
  try {
    return btoa(encodeURIComponent(token));
  } catch (e) {
    return '';
  }
}

function deobfuscateToken(encoded) {
  if (!encoded) return '';
  try {
    return decodeURIComponent(atob(encoded));
  } catch (e) {
    return '';
  }
}

export function getSyncConfig() {
  const data = localStoreAdapter.getSync('ls-sync-config');
  if (!data) {
    return {
      provider: 'none', // 'none', 'github', 'supabase'
      githubUsername: '',
      githubRepo: '',
      githubToken: ''
    };
  }
  return {
    ...data,
    githubToken: deobfuscateToken(data.githubToken)
  };
}

export function saveSyncConfig(config) {
  localStoreAdapter.setSync('ls-sync-config', {
    ...config,
    githubToken: obfuscateToken(config.githubToken)
  });
}

// ── Full State Dump / Hydration ──

// Note: `syncConfig` is intentionally NOT included here. Sync provider settings
// (GitHub username/repo/PAT, Dandy Sync enable flag) are per-device configuration,
// not data to sync - including it would round-trip a plaintext GitHub PAT through
// whichever cloud backend is configured, and could clobber one device's GitHub
// settings with another's.
export function exportData() {
  const payload = {
    tags: getTagsSync(),
    tasks: getTasks(),
    schedule: getSchedule(),
    theme: getTheme()
  };

  const currentWeekKey = getWeekKey();
  for (const key of getAllWeekKeys()) {
    payload[key] = key === currentWeekKey ? getState() : migrateWeekState(localStoreAdapter.getSync(key));
  }

  return payload;
}

export function importData(payload) {
  if (!payload) return;
  if (payload.tags) saveTags(payload.tags);
  if (payload.tasks) saveTasks(payload.tasks);
  if (payload.schedule) saveSchedule(payload.schedule);
  if (payload.theme) saveTheme(payload.theme);

  const currentWeekKey = getWeekKey();
  for (const [key, value] of Object.entries(payload)) {
    if (!key.startsWith('ls-week-') || !value) continue;
    if (key === currentWeekKey) {
      saveState(value);
    } else {
      localStoreAdapter.setSync(key, value);
    }
  }
}
