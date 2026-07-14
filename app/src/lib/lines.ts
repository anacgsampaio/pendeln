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

export function metroLines(bank: Bank, now = new Date()): MetroLine[] {
  return bank.weeks.map((w, idx) => {
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
