// ── Minimum Viable Week calculation ───────────────────────────────────────
// Reads the current schedule and checked state, then returns an array of
// MVW items used to render the chip row.
//
// Intentionally type-based (not ID-based) so custom/renamed sessions count
// correctly — e.g. deleting 'Exercise' and adding 'Arm day' (type: exer)
// still increments the exercise counter.

import { getSchedule, getTasks, getMVWConfig } from './storage.js';

export function getMVW(state) {
  const checked = state.checked;
  const days    = getSchedule();
  const config  = getMVWConfig();

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

  const chips = [];

  if (config.stretch.target > 0) {
    chips.push({
      id: 'stretch',
      label: `Stretch ${stretches}/${config.stretch.outOf || config.stretch.target}`,
      done: stretches >= config.stretch.target,
      partial: stretches > 0 && stretches < config.stretch.target
    });
  }

  if (config.meditate.target > 0) {
    chips.push({
      id: 'meditate',
      label: `Meditate ${meditates}/${config.meditate.outOf || config.meditate.target}`,
      done: meditates >= config.meditate.target,
      partial: meditates > 0 && meditates < config.meditate.target
    });
  }

  if (config.prog.target > 0) chips.push({ id: 'prog', label: 'Programming', done: progDone });
  if (config.draw.target > 0) chips.push({ id: 'draw', label: 'Drawing',     done: drawDone });
  if (config.keys.target > 0) chips.push({ id: 'keys', label: 'Keyboard',    done: keysDone });

  if (config.exer.target > 0) {
    chips.push({
      id: 'exer',
      label: `Exercise ${exerCount}/${config.exer.outOf || config.exer.target}`,
      done: exerCount >= config.exer.target,
      partial: exerCount > 0 && exerCount < config.exer.target
    });
  }

  // One chip per non-scheduled task
  getTasks().forEach(task => {
    chips.push({
      id: task.id,
      label: task.label,
      done: !!(state.tasks && state.tasks[task.id])
    });
  });

  return chips;
}
