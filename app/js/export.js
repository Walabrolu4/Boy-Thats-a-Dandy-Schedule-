// ── Weekly review file export ──────────────────────────────────────────────
// POSTs to the local server (server.js) which writes logs/weekly-reviews.md.
// If a section for the current week already exists it is updated in place.
// Requires the app to be served via `node server.js` (not opened as a file://).

async function saveWeeklyReview() {
  const btn = document.getElementById('saveReviewBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    const res = await fetch('/api/save-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekRange: getWeekRange(),
        content:   buildWeekSection(),
      }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Unknown error');
    showExportFlash('Saved ✓');

  } catch (e) {
    if (e.message.toLowerCase().includes('fetch') || e instanceof TypeError) {
      showExportFlash('Run start.bat first to enable saving');
    } else {
      showExportFlash('Error: ' + e.message);
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save to file'; }
  }
}

// ── Build the Markdown section for the current week ──

function buildWeekSection() {
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

// ── Flash feedback ──

function showExportFlash(msg) {
  const el = document.getElementById('exportFlash');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}
