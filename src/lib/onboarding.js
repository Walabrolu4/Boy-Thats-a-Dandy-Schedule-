// ── Onboarding: generate tags + schedule from a user's habit list ──────────
// Used by OnboardingWizard.svelte to turn a list of
// { name, frequency (1-7), preferredTime ('morning'|'afternoon'|'evening'|'night') }
// into the same shapes as DEFAULT_TAGS/DEFAULT_DAYS in data.js.

const DAY_SHELLS = [
  { key: 'fri', label: 'Fri', jsDay: 5 },
  { key: 'sat', label: 'Sat', jsDay: 6 },
  { key: 'sun', label: 'Sun', jsDay: 0 },
  { key: 'mon', label: 'Mon', jsDay: 1 },
  { key: 'tue', label: 'Tue', jsDay: 2 },
  { key: 'wed', label: 'Wed', jsDay: 3 },
  { key: 'thu', label: 'Thu', jsDay: 4 },
];

const TIME_ORDER = { morning: 0, afternoon: 1, evening: 2, night: 3 };

// Small palette cycled round-robin for auto-generated tags.
const TAG_PALETTE = [
  '#A4C2AD', '#73B887', '#D97746', '#3DD68C',
  '#D9A05B', '#5B9BD9', '#C97AC9', '#E0B33C',
];

function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'habit';
}

function namedHabits(habits) {
  return habits.filter(h => h.name && h.name.trim());
}

// One tag per named habit. mvwTarget/mvwOutOf derived from frequency:
//  - "Every day" (7) -> mvwTarget: 7, mvwOutOf: 7
//  - N > 1          -> mvwTarget: N, mvwOutOf: 7
//  - N === 1        -> mvwTarget: 1 (no mvwOutOf, matches single-session default tags)
export function buildTagsFromHabits(habits) {
  const used = new Set();
  return namedHabits(habits).map((h, i) => {
    const base = slugify(h.name);
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);

    const freq = Math.min(7, Math.max(1, h.frequency || 1));
    const tag = {
      id,
      label: h.name.trim(),
      color: TAG_PALETTE[i % TAG_PALETTE.length],
    };
    if (freq === 7) {
      tag.mvwTarget = 7;
      tag.mvwOutOf = 7;
    } else if (freq > 1) {
      tag.mvwTarget = freq;
      tag.mvwOutOf = 7;
    } else {
      tag.mvwTarget = 1;
    }
    return tag;
  });
}

// 7 day-shells (same keys/labels/jsDay as DEFAULT_DAYS), each habit's
// occurrences spread as evenly as possible across the week, then sorted
// within each day by preferred time (Morning -> Afternoon -> Evening -> Night).
export function buildScheduleFromHabits(habits) {
  const tags = buildTagsFromHabits(habits);
  const days = DAY_SHELLS.map(d => ({ ...d, sessions: [] }));

  namedHabits(habits).forEach((h, idx) => {
    const tag = tags[idx];
    const freq = Math.min(7, Math.max(1, h.frequency || 1));
    const step = 7 / freq;
    const time = h.preferredTime || 'morning';

    for (let i = 0; i < freq; i++) {
      const dayIdx = Math.floor(i * step) % 7;
      days[dayIdx].sessions.push({
        session: {
          id: freq > 1 ? `${tag.id}-${i + 1}` : tag.id,
          label: h.name.trim(),
          tagId: tag.id,
          note: '',
        },
        time,
      });
    }
  });

  return days.map(day => ({
    ...day,
    sessions: [...day.sessions]
      .sort((a, b) => (TIME_ORDER[a.time] ?? 99) - (TIME_ORDER[b.time] ?? 99))
      .map(s => s.session),
  }));
}
