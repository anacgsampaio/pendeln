import type { Bank } from "../../../pipeline/src/model.ts";
import { isDue } from "../../../pipeline/src/srs.ts";

/** Every ingested week is a U-Bahn line on the network map. */
export type MetroLine = {
  label: string; // the week label — the assembler's filter key
  badge: string; // "U13"
  name: string; // short human title
  color: string;
  items: number;
  due: number;
};

// BVG-inspired palette, one per line, cycles past 14
const LINE_COLORS = [
  "#7dad4c", "#da421e", "#16683d", "#f0d722", "#7e5330", "#8c6dab",
  "#528dba", "#224f86", "#f3791d", "#00963f", "#d93c8b", "#4db5c8",
  "#815a3f", "#5a6d24",
];

/**
 * Umsteigebahnhöfe — transfer stations where two lines cross. Riding one
 * selects both lines and focuses the session on the crossing concepts.
 * Chapter numbers refer to the A1 reference; focus terms match exercise text.
 */
export type Intersection = {
  id: string;
  name: string;
  chapters: [number, number];
  focus: string[];
};

export const INTERSECTIONS: Intersection[] = [
  { id: "praep-faelle", name: "Präpositionen ⨯ Fälle", chapters: [11, 3], focus: ["dativ", "akkusativ", "präposition", "preposition", "wechsel"] },
  { id: "artikel-faelle", name: "Artikel ⨯ Fälle", chapters: [2, 3], focus: ["der", "die", "das", "den", "dem", "einen", "einem", "case", "kasus"] },
  { id: "pronomen-faelle", name: "Pronomen ⨯ Fälle", chapters: [4, 3], focus: ["mich", "mir", "dich", "dir", "ihn", "ihm", "pronoun", "pronomen"] },
  { id: "possessiv-artikel", name: "Possessive ⨯ Artikel", chapters: [5, 2], focus: ["mein", "dein", "sein", "ihr", "unser", "kein", "ending", "endung"] },
  { id: "modal-wortstellung", name: "Modalverben ⨯ Wortstellung", chapters: [8, 10], focus: ["modal", "infinitiv", "infinitive", "satzklammer", "bracket", "position"] },
  { id: "negation-wortstellung", name: "Negation ⨯ Wortstellung", chapters: [9, 10], focus: ["nicht", "kein", "negation", "position", "wortstellung", "word order"] },
  { id: "perfekt-big3", name: "Perfekt ⨯ haben/sein", chapters: [12, 7], focus: ["haben", "sein", "partizip", "perfekt", "auxiliary", "hilfsverb"] },
  { id: "verben-wortstellung", name: "Verben ⨯ Wortstellung", chapters: [6, 10], focus: ["verb", "konjugation", "conjugation", "v2", "second position", "stem"] },
];

/** Resolve an intersection to the week labels present in this bank (or null if a line is missing). */
export function intersectionLines(bank: Bank, x: Intersection): [string, string] | null {
  const find = (n: number) => bank.weeks.find((w) => w.label.match(new RegExp(`Kapitel ${n}\\b`)))?.label;
  const a = find(x.chapters[0]);
  const b = find(x.chapters[1]);
  return a && b ? [a, b] : null;
}

export function metroLines(bank: Bank, now = new Date()): MetroLine[] {
  return bank.weeks
    .filter((w) => bank.items.some((i) => i.week === w.label && i.exercises.length > 0))
    .map((w, idx) => {
    const items = bank.items.filter((i) => i.week === w.label && i.exercises.length > 0);
    const m = w.label.match(/Kapitel\s+(\d+)\s*—\s*(.+)$/);
    return {
      label: w.label,
      badge: `U${m ? m[1] : idx + 1}`,
      name: m ? m[2] : w.label,
      color: LINE_COLORS[idx % LINE_COLORS.length],
      items: items.length,
      due: items.filter((i) => isDue(i.srs, now)).length,
    };
  });
}
