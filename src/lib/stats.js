import { getWeekKey, getSchedule, getTagsSync } from './storage.js';

/**
 * Returns historical stats.
 * Sorts weeks chronologically (oldest to newest).
 */
export function getStats() {
  const currentKey = getWeekKey();
  const schedule = getSchedule();
  
  const weeks = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('ls-week-') && key !== currentKey) {
      try {
        const state = JSON.parse(localStorage.getItem(key));
        const dateStrRaw = key.replace('ls-week-', '');
        // Determine the schedule to calculate stats against
        const weekSchedule = state.scheduleSnapshot || schedule;
        let totalSessions = 0;
        let tagScheduled = {}; // tagId -> count
        
        for (const day of weekSchedule) {
          totalSessions += day.sessions.length;
          for (const session of day.sessions) {
            if (session.tagId) {
              tagScheduled[session.tagId] = (tagScheduled[session.tagId] || 0) + 1;
            }
          }
        }
        
        let checkedCount = 0;
        let tagCompletions = {}; // tagId -> count

        if (state && state.checked) {
          for (const [id, entry] of Object.entries(state.checked)) {
            const isDone = typeof entry === 'boolean' ? entry : entry?.value;
            if (isDone) {
              checkedCount++;
              // Use weekSchedule for accurate historical tag lookup
              const sepIdx = id.indexOf('-');
              const dayKey = id.slice(0, sepIdx);
              const sessionId = id.slice(sepIdx + 1);
              const sessionObj = weekSchedule.find(d => d.key === dayKey)?.sessions.find(s => s.id === sessionId);
              if (sessionObj && sessionObj.tagId) {
                tagCompletions[sessionObj.tagId] = (tagCompletions[sessionObj.tagId] || 0) + 1;
              }
            }
          }
        }
        
        // Also count completed tasks
        let completedTasks = 0;
        if (state && state.tasks) {
          for (const entry of Object.values(state.tasks)) {
            if (entry?.value) completedTasks++;
          }
        }

        const adherencePercent = totalSessions > 0 ? Math.round((checkedCount / totalSessions) * 100) : 0;

        weeks.push({
          key,
          dateRaw: dateStrRaw,
          adherencePercent: adherencePercent > 100 ? 100 : adherencePercent,
          completedTasks,
          tagCompletions,
          tagScheduled
        });
      } catch(e) {}
    }
  }

  // Sort chronological
  weeks.sort((a, b) => new Date(a.dateRaw) - new Date(b.dateRaw));

  return weeks;
}

export function generateDummyStats() {
  const dummyKeys = [
    { key: 'ls-week-2026-04-03', checks: 8 },
    { key: 'ls-week-2026-04-10', checks: 12 },
    { key: 'ls-week-2026-04-17', checks: 10 },
    { key: 'ls-week-2026-04-24', checks: 14 },
    { key: 'ls-week-2026-05-01', checks: 16 },
    { key: 'ls-week-2026-05-08', checks: 15 },
    { key: 'ls-week-2026-05-15', checks: 18 }
  ];

  const schedule = getSchedule();
  let availableSlots = [];
  for (const d of schedule) {
    for (const s of d.sessions) {
      availableSlots.push(`${d.key}-${s.id}`);
    }
  }

  if (availableSlots.length === 0) return;

  for (const item of dummyKeys) {
    const state = { checked: {}, tasks: {}, review: {}, scheduleSnapshot: schedule };
    // Shuffle available slots to avoid infinite loops
    let shuffled = [...availableSlots].sort(() => 0.5 - Math.random());
    let toFill = Math.min(item.checks, shuffled.length);
    for (let i = 0; i < toFill; i++) {
      state.checked[shuffled[i]] = { value: true, updatedAt: Date.now() };
    }
    localStorage.setItem(item.key, JSON.stringify(state));
  }
  window.location.reload();
}
