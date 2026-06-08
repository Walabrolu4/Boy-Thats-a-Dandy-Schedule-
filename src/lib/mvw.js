// ── Minimum Viable Week calculation ───────────────────────────────────────
// Reads the current schedule and checked state, then returns an array of
// MVW items used to render the chip row.
//
// Intentionally type-based (not ID-based) so custom/renamed sessions count
// correctly — e.g. deleting 'Exercise' and adding 'Arm day' (type: exer)
// still increments the exercise counter.

import { getSchedule, getTasks } from './storage.js';

export function getMVW(state) {
  const checked = state.checked;
  const days    = getSchedule();

  let stretches = 0, meditates = 0, exerCount = 0;
  let progDone  = false, drawDone = false, keysDone = false;

  for (const day of days) {
    for (const session of day.sessions) {
      if (!checked[`${day.key}-${session.id}`]) continue;

      switch (session.type) {
        case 'exer':   exerCount++;  break;
        case 'prog':   progDone  = true; break;
        case 'draw':   if (!session.micro) drawDone  = true; break;
        case 'keys':   if (!session.micro) keysDone  = true; break;
        case 'anchor':
          if (session.label.toLowerCase().includes('stretch'))  stretches++;
          if (session.label.toLowerCase().includes('meditat'))  meditates++;
          break;
      }
    }
  }

  return [
    { label: `Stretch ${stretches}/7`,  done: stretches >= 5, partial: stretches > 0 && stretches < 5 },
    { label: `Meditate ${meditates}/7`, done: meditates >= 5, partial: meditates > 0 && meditates < 5 },
    { label: 'Programming',             done: progDone },
    { label: 'Drawing',                 done: drawDone },
    { label: 'Keyboard',                done: keysDone },
    { label: `Exercise ${exerCount}/3`, done: exerCount >= 2, partial: exerCount === 1 },
    // One chip per non-scheduled task
    ...getTasks().map(task => ({
      label: task.label,
      done:  !!(state.tasks && state.tasks[task.id]),
    })),
  ];
}
