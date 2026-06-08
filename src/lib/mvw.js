// ── Minimum Viable Week calculation ───────────────────────────────────────
// Reads the current schedule, tasks, and checked state, then returns an array of
// MVW items used to render the chip row.

import { getSchedule, getTasks, getTagsSync } from './storage.js';

export function getMVW(state) {
  const checked = state.checked || {};
  const days    = getSchedule();
  const tags    = getTagsSync();

  // Initialize progress counters for all tags
  const progress = {};
  tags.forEach(tag => progress[tag.id] = 0);

  // Count scheduled blocks
  for (const day of days) {
    for (const session of day.sessions) {
      // Micro sessions traditionally don't count towards some MVWs, 
      // but let's say they don't count towards anything now, unless specified.
      // Wait, let's keep it simple: if it's checked, it counts.
      if (session.micro) continue; 
      
      if (!checked[`${day.key}-${session.id}`]) continue;

      if (session.tagId && progress[session.tagId] !== undefined) {
        progress[session.tagId]++;
      }
    }
  }

  // Count floating tasks
  const allTasks = getTasks();
  for (const task of allTasks) {
    if (!state.tasks || !state.tasks[task.id]) continue;
    
    // If the task belongs to a tag, count it towards the tag
    if (task.tagId && progress[task.tagId] !== undefined) {
      progress[task.tagId]++;
    }
  }

  const chips = [];

  // Generate a chip for every tag with a target > 0
  tags.forEach(tag => {
    if (tag.mvwTarget > 0) {
      const count = progress[tag.id];
      const target = tag.mvwTarget;
      const outOf = tag.mvwOutOf;

      let label = tag.label;
      if (outOf || target > 1) {
        label = `${tag.label} ${count}/${outOf || target}`;
      }

      chips.push({
        id: tag.id,
        label,
        done: count >= target,
        partial: count > 0 && count < target,
        color: tag.color // Passed for styling
      });
    }
  });

  return chips;
}
