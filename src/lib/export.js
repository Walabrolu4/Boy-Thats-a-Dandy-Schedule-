// ── Weekly review file export ──────────────────────────────────────────────
// POSTs to the local server (server.js) which writes logs/weekly-reviews.md.
// If a section for the current week already exists it is updated in place.
// Requires the app to be served via `node server.js` on port 3131.
// NOTE: In Sprint 5 this will be replaced with a Supabase upsert.

import { getWeekRange, getState, getSchedule, getTasks } from './storage.js';
import { getMVW } from './mvw.js';

export async function saveWeeklyReview(callbacks = {}) {
  const { onStart, onSuccess, onError, onFinally } = callbacks;
  if (onStart) onStart();

  try {
    const res = await fetch('http://localhost:3131/api/save-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekRange: getWeekRange(),
        content:   buildWeekSection(),
      }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Unknown error');
    if (onSuccess) onSuccess('Saved ✓');

  } catch (e) {
    const msg = (e.message && e.message.toLowerCase().includes('fetch')) || e instanceof TypeError
      ? 'Run start.bat first to enable saving'
      : 'Error: ' + e.message;
    if (onError) onError(msg);
  } finally {
    if (onFinally) onFinally();
  }
}

// ── Build the Markdown section for the current week ──

export function buildWeekSection() {
  const state     = getState();
  const days      = getSchedule();
  const tasks     = getTasks();
  const checked   = state.checked || {};
  const tasksDone = state.tasks   || {};
  const r         = state.review  || {};

  // Sessions completed this week
  const completedLines = [];
  for (const day of days) {
    for (const s of day.sessions) {
      if (checked[`${day.key}-${s.id}`]) {
        const tag = s.micro ? ' *(micro)*' : '';
        completedLines.push(`- ${day.label}: **${s.label}**${tag}`);
      }
    }
  }
  if (completedLines.length === 0) completedLines.push('- None completed');

  // Unscheduled tasks
  const taskLines = tasks.length
    ? tasks.map(t => `- ${tasksDone[t.id] ? '✓' : '✗'} ${t.label}`)
    : ['- None'];

  // MVW summary
  const mvwLines = getMVW(state).map(item =>
    `- ${item.done ? '✓' : item.partial ? '◑' : '✗'} ${item.label}`
  );

  return `## Week of ${getWeekRange()}

### Sessions completed
${completedLines.join('\n')}

### Unscheduled tasks
${taskLines.join('\n')}

### Minimum viable week
${mvwLines.join('\n')}

### Reflection

**Which sessions didn't happen, and why?**
${r.q1 ? r.q1.trim() : '—'}

**Where did I get stuck?**
${r.q2 ? r.q2.trim() : '—'}

**One thing to protect next week:**
${r.q3 ? r.q3.trim() : '—'}

---`;
}
