import { DialogBatchSchema, validateDialog } from "../src/schema.ts";
import { structuredCall } from "../src/llm.ts";
import { loadBank, saveBank } from "../src/bank.ts";
import { newSrsState } from "../src/srs.ts";

/**
 * Generate survival-German dialogue scenarios as playable chats.
 * Stored as bank items (kind: dialog) under a dedicated pseudo-week;
 * they carry no exercises so sessions ignore them.
 *
 *   npx tsx scripts/generate-dialogs.ts [scenario slugs...]
 */

const WEEK = "Dialoge — Überleben im Alltag";

const SCENARIOS = [
  { slug: "essen_bestellen", brief: "Ordering food and drinks at a casual restaurant, asking a question about the menu, and asking for the bill" },
  { slug: "baeckerei", brief: "Buying bread and Brötchen at a bakery counter, quantities and prices" },
  { slug: "hilfe_rufen", brief: "Calling 112 for help — someone is hurt, give location, describe what happened, answer the operator" },
  { slug: "hausverwaltung", brief: "Calling the landlord/Hausverwaltung: the heating is broken, request a repair, arrange a time for the technician" },
  { slug: "arzttermin", brief: "Phoning a doctor's office to make an appointment, describing symptoms, agreeing on a time" },
  { slug: "supermarkt", brief: "At the supermarket checkout: bag question, payment, Pfand, asking where something is" },
  { slug: "bvg_fahrkarte", brief: "Buying a ticket / asking which U-Bahn line to take, dealing with a Kontrolleur politely" },
  { slug: "nachbarn_smalltalk", brief: "Meeting a new neighbor in the stairwell: introducing yourself, where you're from, a bit of small talk" },
  { slug: "amt_termin", brief: "At the Bürgeramt: checking in for an Anmeldung appointment, handing over documents, answering simple questions" },
  { slug: "apotheke", brief: "At the pharmacy: describing a headache/cold, asking for something without prescription, dosage question" },
];

const wanted = process.argv.slice(2);
const scenarios = wanted.length > 0 ? SCENARIOS.filter((s) => wanted.includes(s.slug)) : SCENARIOS;

const PROMPT = (batch: typeof SCENARIOS) => `You are the dialogue-generation stage of pendeln, a German learning app. The learner is A1-level, an English speaker living in Germany.

Write one dialogue per scenario below as a realistic chat the learner plays on their phone: the other party ("them") speaks, and at each learner turn ("me") there are exactly 3 candidate replies, exactly 1 correct. Wrong options must be tempting — plausible A1 mistakes (wrong case, false friend, wrong register/du-Sie, word order) — and each option carries a one-line English "why".

Rules:
- German is natural spoken A1: short sentences, real register (Sie with strangers/officials).
- 6-10 turns, starting with "them" unless the scenario demands otherwise, ending with a natural resolution.
- The "de" field of a me-turn holds the correct line, and that exact line must also appear among its options.
- id must be dialog_<slug> using the scenario slug.

SCENARIOS:
${batch.map((s) => `- slug: ${s.slug} — ${s.brief}`).join("\n")}`;

const bank = loadBank();
const BATCH = 3;
let added = 0;
for (let i = 0; i < scenarios.length; i += BATCH) {
  const batch = scenarios.slice(i, i + BATCH);
  const { dialogs } = await structuredCall(DialogBatchSchema, PROMPT(batch));
  for (const d of dialogs) {
    const problem = validateDialog(d);
    if (problem) {
      console.log(`  ! skipped ${d.id}: ${problem}`);
      continue;
    }
    const id = d.id.startsWith("dialog_") ? d.id : `dialog_${d.id}`;
    const existing = bank.items.find((it) => it.id === id);
    if (existing) {
      existing.dialog = d;
    } else {
      bank.items.push({ id, kind: "dialog", week: WEEK, dialog: d, exercises: [], srs: newSrsState(), recentFails: 0 });
    }
    added++;
    console.log(`  ✓ ${id} — ${d.title_de} (${d.turns.length} turns)`);
  }
  saveBank(bank);
  console.log(`progress: ${Math.min(i + BATCH, scenarios.length)}/${scenarios.length} scenarios`);
}
if (!bank.weeks.some((w) => w.label === WEEK)) {
  bank.weeks.push({ label: WEEK, ingestedAt: new Date().toISOString(), themes: ["Survival-Dialoge"] });
  saveBank(bank);
}
console.log(`done — ${added} dialogs in the bank`);
