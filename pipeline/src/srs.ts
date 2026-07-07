/**
 * Dumb SM-2, on purpose (doc 05: "fancy scheduling only after 8 weeks of real data").
 */

export type SrsState = {
  ef: number; // easiness factor
  intervalDays: number;
  reps: number;
  due: string; // ISO — new items are due immediately
};

export function newSrsState(): SrsState {
  return { ef: 2.5, intervalDays: 0, reps: 0, due: new Date().toISOString() };
}

/** grade: 0 = fail, 1 = hard, 2 = good */
export function review(s: SrsState, grade: 0 | 1 | 2, now = new Date()): SrsState {
  const q = grade === 0 ? 2 : grade === 1 ? 3.5 : 5; // map onto SM-2's 0..5
  let { ef, intervalDays, reps } = s;

  if (grade === 0) {
    reps = 0;
    intervalDays = 0; // relearn today — revenge is scheduled
  } else {
    reps += 1;
    intervalDays = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(intervalDays * ef);
  }
  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const due = new Date(now);
  due.setDate(due.getDate() + intervalDays);
  return { ef, intervalDays, reps, due: due.toISOString() };
}

export function isDue(s: SrsState, now = new Date()): boolean {
  return new Date(s.due) <= now;
}
