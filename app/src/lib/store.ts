import { supabase } from "./supabase";
import type { Bank, BankItem } from "../../../pipeline/src/model.ts";
import type { SrsState } from "../../../pipeline/src/srs.ts";

/**
 * Offline-first store: Supabase is the source of truth, localStorage is the
 * working copy. Sessions run entirely from the cache (the U8 has tunnels);
 * SRS updates queue locally and flush whenever the network is back.
 */

const BANK_KEY = "pendeln.bank";
const PENDING_KEY = "pendeln.pending";

type PendingUpdate = { srs: SrsState; recent_fails: number };

export function cachedBank(): Bank | null {
  const raw = localStorage.getItem(BANK_KEY);
  return raw ? (JSON.parse(raw) as Bank) : null;
}

export async function refreshBank(): Promise<Bank | null> {
  try {
    const [{ data: weeks, error: wErr }, { data: items, error: iErr }] = await Promise.all([
      supabase.from("weeks").select("*").order("ingested_at"),
      supabase.from("items").select("*"),
    ]);
    if (wErr || iErr || !weeks || !items) return cachedBank();
    const bank: Bank = {
      weeks: weeks.map((w) => ({ label: w.label, ingestedAt: w.ingested_at, themes: w.themes })),
      items: items.map(
        (r): BankItem => ({
          id: r.id,
          kind: r.kind,
          week: r.week,
          vocab: r.vocab ?? undefined,
          grammar: r.grammar ?? undefined,
          dialog: r.dialog ?? undefined,
          exercises: r.exercises,
          srs: r.srs,
          recentFails: r.recent_fails,
        }),
      ),
    };
    // pending local updates are newer than what we just fetched
    const pending = loadPending();
    for (const item of bank.items) {
      const p = pending[item.id];
      if (p) {
        item.srs = p.srs;
        item.recentFails = p.recent_fails;
      }
    }
    localStorage.setItem(BANK_KEY, JSON.stringify(bank));
    return bank;
  } catch {
    return cachedBank();
  }
}

function loadPending(): Record<string, PendingUpdate> {
  return JSON.parse(localStorage.getItem(PENDING_KEY) ?? "{}");
}

export function recordReview(item: BankItem): void {
  const bank = cachedBank();
  if (bank) {
    const hit = bank.items.find((i) => i.id === item.id);
    if (hit) {
      hit.srs = item.srs;
      hit.recentFails = item.recentFails;
      localStorage.setItem(BANK_KEY, JSON.stringify(bank));
    }
  }
  const pending = loadPending();
  pending[item.id] = { srs: item.srs, recent_fails: item.recentFails };
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  void flushPending();
}

let flushing = false;
export async function flushPending(): Promise<void> {
  if (flushing || !navigator.onLine) return;
  const pending = loadPending();
  const ids = Object.keys(pending);
  if (ids.length === 0) return;
  flushing = true;
  try {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return; // no session — keep queue, retry after next login
    for (const id of ids) {
      // .select() so an RLS no-op (0 rows) doesn't masquerade as success
      const { data, error } = await supabase
        .from("items")
        .update({ srs: pending[id].srs, recent_fails: pending[id].recent_fails, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id");
      if (error || !data || data.length === 0) return; // keep in queue, retry later
      const current = loadPending();
      delete current[id];
      localStorage.setItem(PENDING_KEY, JSON.stringify(current));
    }
  } finally {
    flushing = false;
  }
}

export function pendingCount(): number {
  return Object.keys(loadPending()).length;
}

window.addEventListener("online", () => void flushPending());
