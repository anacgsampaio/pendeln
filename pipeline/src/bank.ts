import fs from "node:fs";
import path from "node:path";
import type { GrammarPoint, VocabItem } from "./schema.ts";
import { newSrsState } from "./srs.ts";
import type { Bank, BankItem } from "./model.ts";

/**
 * The item bank. JSON file for the CLI (which conveniently satisfies R10:
 * all user data exportable as JSON); the app reads the same shape from
 * Supabase. Types live in model.ts (browser-safe).
 */

export type { Bank, BankItem } from "./model.ts";

const BANK_PATH = process.env.PENDELN_BANK ?? path.join(process.cwd(), "bank.json");

export function loadBank(): Bank {
  if (!fs.existsSync(BANK_PATH)) return { weeks: [], items: [] };
  return JSON.parse(fs.readFileSync(BANK_PATH, "utf8")) as Bank;
}

export function saveBank(bank: Bank): void {
  fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2));
}

export function vocabId(v: VocabItem): string {
  return `vocab:${v.lemma.toLowerCase()}`;
}

export function grammarId(g: GrammarPoint): string {
  return `grammar:${g.id}`;
}

/**
 * Dedup-and-boost: if the item already exists, the teacher repeating it is a
 * signal — pull it due now instead of re-adding it. Returns items that are new.
 */
export function mergeWeek(
  bank: Bank,
  week: string,
  themes: string[],
  vocab: VocabItem[],
  grammar: GrammarPoint[],
): BankItem[] {
  const existing = new Map(bank.items.map((i) => [i.id, i]));
  const fresh: BankItem[] = [];

  for (const v of vocab) {
    const id = vocabId(v);
    const hit = existing.get(id);
    if (hit) {
      hit.srs.due = new Date().toISOString(); // boost
    } else {
      fresh.push({ id, kind: "vocab", week, vocab: v, exercises: [], srs: newSrsState(), recentFails: 0 });
    }
  }
  for (const g of grammar) {
    const id = grammarId(g);
    const hit = existing.get(id);
    if (hit) {
      hit.srs.due = new Date().toISOString();
    } else {
      fresh.push({ id, kind: "grammar", week, grammar: g, exercises: [], srs: newSrsState(), recentFails: 0 });
    }
  }

  bank.items.push(...fresh);
  bank.weeks.push({ label: week, ingestedAt: new Date().toISOString(), themes });
  return fresh;
}
