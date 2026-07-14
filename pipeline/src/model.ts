import type { Dialog, Exercise, GrammarPoint, VocabItem } from "./schema.ts";
import type { SrsState } from "./srs.ts";

/**
 * The bank's data model — browser-safe (no node imports) so the web app can
 * share it. bank.ts adds the JSON-file store on top for the CLI.
 */

export type BankItem = {
  id: string;
  kind: "vocab" | "grammar" | "dialog";
  week: string;
  vocab?: VocabItem;
  grammar?: GrammarPoint;
  dialog?: Dialog;
  exercises: Exercise[];
  srs: SrsState;
  /** failures in the last 14 days — ≥2 marks a weak spot */
  recentFails: number;
};

export type Bank = {
  weeks: { label: string; ingestedAt: string; themes: string[] }[];
  items: BankItem[];
};
