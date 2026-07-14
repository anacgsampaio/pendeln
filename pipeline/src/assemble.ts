import type { Bank, BankItem } from "./model.ts";
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

/** Round-robin across weeks so one line never hogs a multi-line ride. */
function interleaveByWeek(items: BankItem[]): BankItem[] {
  const byWeek = new Map<string, BankItem[]>();
  for (const i of items) {
    const list = byWeek.get(i.week) ?? [];
    list.push(i);
    byWeek.set(i.week, list);
  }
  const queues = [...byWeek.values()];
  const out: BankItem[] = [];
  for (let round = 0; out.length < items.length; round++) {
    for (const q of queues) if (round < q.length) out.push(q[round]);
  }
  return out;
}

/**
 * Stage-aware exercise choice: fresh items start with recognition (recall/MC),
 * maturing items graduate to production (cloze, then scramble). Within a stage,
 * prefer whichever type the session has seen least — no more flashcard walls.
 */
const STAGE_PREFERENCE: Record<"new" | "learning" | "mature", Exercise["type"][]> = {
  new: ["mc_grammar", "cloze", "recall", "scramble"],
  learning: ["cloze", "scramble", "mc_grammar", "recall"],
  mature: ["scramble", "cloze", "mc_grammar", "recall"],
};

function pickExercise(
  item: BankItem,
  typeCounts: Record<Exercise["type"], number>,
  used: Set<Exercise>,
): Exercise | undefined {
  const candidates = item.exercises.filter((e) => !used.has(e));
  if (candidates.length === 0) return undefined;
  const stage = item.srs.reps <= 1 ? "new" : item.srs.reps <= 3 ? "learning" : "mature";
  const pref = STAGE_PREFERENCE[stage];
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const ex of candidates) {
    const prefIdx = pref.indexOf(ex.type);
    const score = (pref.length - prefIdx) * 2 - typeCounts[ex.type];
    if (score > bestScore) {
      bestScore = score;
      best = ex;
    }
  }
  return best;
}

/** How strongly an item's exercises touch the focus concepts (intersection rides). */
function focusScore(item: BankItem, focus: string[]): number {
  let hits = 0;
  for (const ex of item.exercises) {
    const text = `${ex.prompt} ${ex.answer} ${ex.explanation}`.toLowerCase();
    for (const f of focus) if (text.includes(f)) hits++;
  }
  if (item.kind === "grammar" && item.grammar) {
    const text = `${item.grammar.name} ${item.grammar.summary}`.toLowerCase();
    for (const f of focus) if (text.includes(f)) hits += 2; // grammar points ARE the crossing
  }
  return hits;
}

export function assembleSession(
  bank: Bank,
  minutes: number,
  now = new Date(),
  lines?: string[],
  focus?: string[],
): SessionSlot[] {
  const budget = minutes * 60;

  // riding chosen lines: due items first, then pure revisit — mastery is no excuse
  let poolList: Array<{ pool: BankItem[]; target: number }>;
  if (lines && lines.length > 0) {
    let sel = bank.items.filter((i) => i.exercises.length > 0 && lines.includes(i.week));
    if (focus && focus.length > 0) {
      const f = focus.map((s) => s.toLowerCase());
      // transfer-station ride: items touching the crossing concepts board first
      sel = [...sel].sort((a, b) => focusScore(b, f) - focusScore(a, f));
      poolList = [
        { pool: interleaveByWeek(sel.filter((i) => focusScore(i, f) > 0)), target: budget * 0.75 },
        { pool: interleaveByWeek(sel.filter((i) => focusScore(i, f) === 0)), target: budget * 0.25 },
      ];
    } else {
      poolList = [
        { pool: interleaveByWeek(sel.filter((i) => isDue(i.srs, now))), target: budget * 0.7 },
        { pool: interleaveByWeek(sel.filter((i) => !isDue(i.srs, now))), target: budget * 0.3 },
      ];
    }
  } else {
    const newestWeek = bank.weeks.at(-1)?.label;
    const pools = {
      fresh: bank.items.filter((i) => i.week === newestWeek && i.exercises.length > 0),
      due: bank.items.filter((i) => i.week !== newestWeek && isDue(i.srs, now) && i.exercises.length > 0),
      weak: bank.items.filter((i) => i.recentFails >= 2 && i.exercises.length > 0),
    };
    poolList = [
      { pool: pools.fresh, target: budget * 0.5 },
      { pool: pools.due, target: budget * 0.35 },
      { pool: pools.weak, target: budget * 0.15 },
    ];
  }

  const slots: SessionSlot[] = [];
  const usedExercises = new Set<Exercise>();
  const typeCounts: Record<Exercise["type"], number> = { recall: 0, cloze: 0, scramble: 0, mc_grammar: 0 };

  const fill = (pool: BankItem[], target: number) => {
    let spent = 0;
    // breadth-first: touch every item once before repeating any
    let pass = 0;
    while (spent < target && pass < 3) {
      let progressed = false;
      for (const item of pool) {
        if (spent >= target) break;
        const ex = pickExercise(item, typeCounts, usedExercises);
        if (!ex) continue;
        usedExercises.add(ex);
        typeCounts[ex.type] += 1;
        slots.push({ item, exercise: ex });
        spent += SECONDS_PER_TYPE[ex.type];
        progressed = true;
      }
      if (!progressed) break;
      pass += 1;
    }
    return spent;
  };

  // unused budget cascades forward — a light pool never shortens the ride
  let leftover = 0;
  for (const { pool, target } of poolList) {
    leftover += target - fill(pool, target + leftover);
  }

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
