# Rationale: Now that's a Dandy Routine!

> Why this app exists, what research it's built on, and what problem it's actually solving.

---

## The Problem

Maintaining multiple long-term skills — programming, drawing, music, exercise — is hard not because of effort, but because of **system failure**. Without structure, high-motivation days drive everything and low-motivation days drive nothing. The result is inconsistency, guilt, and skills that plateau.

The existing tools don't fit the problem well. Calendar apps are for appointments, not habits. Habit trackers (Streaks, Habitica) treat all habits equally — they can't distinguish a daily anchor (stretching) from a weekly skill block (drawing). General-purpose todo apps have no concept of scheduling across a multi-day cycle, and no built-in concept of "good enough for the week."

This app is purpose-built around one learner's actual structure. It doesn't try to be generic.

---

## The Research Base

### Spaced Practice (Distributed Practice)
The core finding in learning science is that **spreading practice over time dramatically outperforms massing it**. Ebbinghaus's forgetting curve shows that memory decays exponentially after a single session; returning to material at intervals resets that decay at a higher baseline each time.

Cepeda et al. (2006) found that distributed practice improved retention by up to 64% over massed practice across a wide range of tasks and time horizons. This is one of the most replicated findings in cognitive psychology.

**Applied here:** skill sessions are spaced across the week rather than batched. A single drawing session on Friday and a micro on Monday is more effective than two back-to-back sessions on Saturday.

### Consistency Over Intensity
Ericsson's work on deliberate practice (1993) and subsequent replication studies consistently show that **regularity of practice predicts skill acquisition better than session length**. A 30-minute session that happens beats a 2-hour session that doesn't.

This is the basis for the Minimum Viable Week concept — defining a floor that is achievable even in a disrupted week, so the habit never fully breaks.

### The "Never Miss Twice" Rule
Lally et al. (2010, *European Journal of Social Psychology*) studied habit formation in real-world conditions. They found that **missing a single instance of a habit had no statistically significant effect on long-term habit strength**, but that multiple consecutive misses did. The practical implication: one missed session is irrelevant; the only thing that matters is getting back on the next scheduled day.

Makeups were intentionally excluded from this app — there is no "catch up" mechanism because the research says it doesn't help and it creates psychological pressure that leads to quitting.

### Motor Skill Consolidation and Micro-Sessions
For motor skills specifically (drawing, keyboard), research on motor learning consolidation (Walker et al., 2003; Robertson et al., 2004) shows that **skill gains are consolidated during the 24–48 hours after a practice session**, not during the session itself. A short "touch" session mid-week, close to the last full session, captures the consolidation window and prevents regression waiting for the next full session.

This is the basis for **micro-sessions** — short, non-required practices that mark a skill as touched without counting toward the Minimum Viable Week.

### Habit Stacking and Daily Anchors
Clear's *Atomic Habits* (2018) and the broader habits literature distinguish between **habits that benefit from daily repetition** (stretching, meditation) and **skills that need spacing** (drawing, programming). Attempting to treat both the same way creates an unsustainable schedule.

Daily anchors in this app (Stretch, Meditate) are tracked separately and evaluated against a 5/7 target rather than 7/7, acknowledging that perfect streaks are psychologically counterproductive.

### External Tracking and Motivation
Self-determination theory (Deci & Ryan, 1985) identifies **competence** — seeing measurable progress — as a core driver of intrinsic motivation. Simple external tracking (charts, checkmarks, completion summaries) leverages this even for internally-driven goals. The user's own experience confirms this: Toggl for programming, Bookmory for reading, both already embedded in their practice.

The MVW chip row and weekly review export are direct applications of this.

---

## The Design Philosophy

**The week runs Friday → Thursday.** This is intentional — it aligns with the user's natural psychological week, which resets after the teaching week ends on Thursday.

**Minimum Viable Week, not streaks.** Streaks create all-or-nothing thinking. MVW creates a floor. Hitting the floor every week for a year is worth more than hitting the ceiling twice and then stopping.

**The schedule is yours to break.** The drag-and-drop reordering, custom sessions, and session editing exist because the research says the *structure* matters, not the specific content. If "Arm Day" is your exercise session this week, it should count — not break the system.

**Low friction on review.** The Thursday weekly review is 5 minutes: three questions, one save button. If reviewing the week takes 20 minutes, it won't happen.

---

## Sources

- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380.
- Deci, E. L., & Ryan, R. M. (1985). *Intrinsic Motivation and Self-Determination in Human Behavior*. Plenum Press.
- Ebbinghaus, H. (1885). *Über das Gedächtnis* [Memory: A Contribution to Experimental Psychology]. Duncker & Humblot.
- Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. *Psychological Review, 100*(3), 363–406.
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *European Journal of Social Psychology, 40*(6), 998–1009.
- Robertson, E. M., Pascual-Leone, A., & Press, D. Z. (2004). Awareness modifies the skill-learning benefits of sleep. *Current Biology, 14*(3), 208–212.
- Walker, M. P., Brakefield, T., Morgan, A., Hobson, J. A., & Stickgold, R. (2002). Practice with sleep makes perfect: Sleep-dependent motor skill learning. *Neuron, 35*(1), 205–211.
- Clear, J. (2018). *Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones*. Avery.
