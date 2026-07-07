import type { Bank, BankItem } from "./bank.ts";
import type { Exercise } from "./schema.ts";
import { isDue } from "./srs.ts";

/**
 * The session assembler — deterministic, offline, no LLM (doc 04).
 * 50% newest week · 35% SRS-due · 15% weak spots, packed to target minutes.
 */

const SECONDS_PER_TYPE: Record<Exercise["type"], number> = {
  recall: 15,
  mc_grammar: 20,
  cloze: 25,
  scramble: 35,
};

export type SessionSlot = { item: BankItem; exercise: Exercise };

export function assembleSession(bank: Bank, minutes: number, now = new Date()): SessionSlot[] {
  const budget = minutes * 60;
  const newestWeek = bank.weeks.at(-1)?.label;

  const pools = {
    fresh: bank.items.filter((i) => i.week === newestWeek && i.exercises.length > 0),
    due: bank.items.filter((i) => i.week !== newestWeek && isDue(i.srs, now) && i.exercises.length > 0),
    weak: bank.items.filter((i) => i.recentFails >= 2 && i.exercises.length > 0),
  };

  const targets = { fresh: budget * 0.5, due: budget * 0.35, weak: budget * 0.15 };
  const slots: SessionSlot[] = [];
  const usedExercises = new Set<Exercise>();

  const fill = (pool: BankItem[], target: number) => {
    let spent = 0;
    // breadth-first: touch every item once before repeating any
    let pass = 0;
    while (spent < target && pass < 3) {
      let progressed = false;
      for (const item of pool) {
        if (spent >= target) break;
        const ex = item.exercises.find((e) => !usedExercises.has(e));
        if (!ex) continue;
        usedExercises.add(ex);
        slots.push({ item, exercise: ex });
        spent += SECONDS_PER_TYPE[ex.type];
        progressed = true;
      }
      if (!progressed) break;
      pass += 1;
    }
    return spent;
  };

  let leftover = 0;
  leftover += targets.fresh - fill(pools.fresh, targets.fresh);
  leftover += targets.due - fill(pools.due, targets.due + leftover);
  fill(pools.weak, targets.weak + leftover); // a bad week never becomes a punishment session

  return orderForTheTrain(slots);
}

/**
 * Shuffle with constraints: never the same item back-to-back, open easy
 * (train-boarding warm-up), end on something winnable.
 */
function orderForTheTrain(slots: SessionSlot[]): SessionSlot[] {
  const sorted = [...slots].sort(() => Math.random() - 0.5);

  // no same item twice in a row
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].item.id === sorted[i - 1].item.id) {
      const j = sorted.findIndex((s, k) => k > i && s.item.id !== sorted[i - 1].item.id);
      if (j > -1) [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
  }

  // easiest first, winnable last
  const easiest = sorted.reduce((min, s) => (s.exercise.difficulty < min.exercise.difficulty ? s : min), sorted[0]);
  const winnable = [...sorted].reverse().find((s) => s.exercise.difficulty <= 2 && s !== easiest);
  const middle = sorted.filter((s) => s !== easiest && s !== winnable);
  return [easiest, ...middle, ...(winnable ? [winnable] : [])].filter(Boolean);
}
