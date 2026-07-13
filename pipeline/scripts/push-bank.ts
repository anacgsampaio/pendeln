import "../src/env.ts";
import { createClient } from "@supabase/supabase-js";
import { loadBank } from "../src/bank.ts";

/**
 * Push bank.json to Supabase — the laptop half of the sync (doc 07, amended:
 * ingest runs on the laptop via Claude Code auth; the app is practice-only).
 * Items are upserted; SRS state in the cloud is only overwritten for items
 * the app hasn't touched yet (app-side updated_at wins).
 *
 *   npx tsx scripts/push-bank.ts
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.PENDELN_USER_EMAIL;
if (!url || !key || !email) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / PENDELN_USER_EMAIL missing from pipeline/.env");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// find-or-create the user so pushing works before the first Google login;
// Supabase links the Google identity to this user by verified email later.
async function userId(): Promise<string> {
  const { data: list, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const hit = list.users.find((u) => u.email === email);
  if (hit) return hit.id;
  const { data: created, error: cErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (cErr) throw cErr;
  console.log(`created user ${email}`);
  return created.user.id;
}

const bank = loadBank();
if (bank.items.length === 0) throw new Error("bank.json is empty — ingest something first");
const uid = await userId();

const { error: wErr } = await supabase.from("weeks").upsert(
  bank.weeks.map((w) => ({
    user_id: uid,
    label: w.label,
    ingested_at: w.ingestedAt,
    themes: w.themes,
  })),
);
if (wErr) throw wErr;

// don't clobber SRS state the app already advanced: keep cloud srs for existing items
const { data: existing, error: eErr } = await supabase
  .from("items")
  .select("id")
  .eq("user_id", uid);
if (eErr) throw eErr;
const known = new Set((existing ?? []).map((r) => r.id));

const fresh = bank.items.filter((i) => !known.has(i.id));
if (fresh.length > 0) {
  const { error: iErr } = await supabase.from("items").upsert(
    fresh.map((i) => ({
      user_id: uid,
      id: i.id,
      kind: i.kind,
      week: i.week,
      vocab: i.vocab ?? null,
      grammar: i.grammar ?? null,
      exercises: i.exercises,
      srs: i.srs,
      recent_fails: i.recentFails,
    })),
  );
  if (iErr) throw iErr;
}
console.log(`pushed: ${fresh.length} new items (${known.size} already in cloud) · ${bank.weeks.length} weeks · user ${email}`);
