// ── Weekly review file export ──────────────────────────────────────────────
// Generates a markdown file of the current week's review and triggers a
// browser download, keeping the app 100% local and offline-capable.

import { getWeekRange, getState, getSchedule, getTasks } from './storage.js';
import { getMVW } from './mvw.js';

export async function saveWeeklyReview(callbacks = {}) {
  const { onStart, onSuccess, onError, onFinally } = callbacks;
  if (onStart) onStart();

  try {
    const weekRange = getWeekRange();
    const content = buildWeekSection();
    
    // Create a Blob from the markdown content
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `Weekly Review - ${weekRange.replace(/[^a-zA-Z0-9 -]/g, '')}.md`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    if (onSuccess) onSuccess('Downloaded ✓');

  } catch (e) {
    if (onError) onError('Error: ' + e.message);
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
