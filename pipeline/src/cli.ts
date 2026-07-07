import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { extractFromFile } from "./extract.ts";
import { generateExercises } from "./generate.ts";
import { loadBank, saveBank, mergeWeek, type BankItem } from "./bank.ts";
import { assembleSession } from "./assemble.ts";
import { review as srsReview, isDue } from "./srs.ts";
import type { Extraction } from "./schema.ts";

const rl = readline.createInterface({ input: stdin, output: stdout });

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "ingest":
      await ingest(rest);
      break;
    case "session":
      await session(rest);
      break;
    case "stats":
      stats();
      break;
    default:
      console.log(`pendeln 🚃 — commute-sized German practice from your own course material

  pendeln ingest <file> --week "Woche 12"   sunday ritual: extract → review → generate
  pendeln session [--minutes 10]            play a session (offline, from bank.json)
  pendeln stats                             class readiness, due counts, weak spots`);
  }
  rl.close();
}

// ── the sunday ritual ────────────────────────────────────────────────────────

async function ingest(args: string[]) {
  const file = args.find((a) => !a.startsWith("--"));
  const weekIdx = args.indexOf("--week");
  const week = weekIdx > -1 ? args[weekIdx + 1] : `Woche ${new Date().toISOString().slice(0, 10)}`;
  if (!file) throw new Error("usage: pendeln ingest <file> --week \"Woche 12\"");

  console.log(`\nreading ${file} …`);
  const extraction = await extractFromFile(file);
  const approved = await reviewCheckpoint(extraction);

  const bank = loadBank();
  const fresh = mergeWeek(bank, week, extraction.themes, approved.vocab, approved.grammar_points);
  const boosted = approved.vocab.length + approved.grammar_points.length - fresh.length;
  console.log(`\n${fresh.length} new items · ${boosted} re-taught (boosted, not duplicated)`);

  if (fresh.length > 0) {
    console.log("generating exercises …");
    const byItem = await generateExercises(fresh);
    let total = 0;
    for (const item of fresh) {
      item.exercises = byItem.get(item.id) ?? [];
      total += item.exercises.length;
    }
    console.log(`${total} exercises passed validation.`);
  }
  saveBank(bank);
  console.log(`\n${week} committed. Bis Montag auf der U-Bahn. 🚃`);
}

/** The non-negotiable human-in-the-loop moment. Target: under 60 seconds. */
async function reviewCheckpoint(ex: Extraction): Promise<Extraction> {
  console.log(`\nfound: ${ex.vocab.length} words · ${ex.grammar_points.length} grammar points · themes: ${ex.themes.join(", ")}\n`);

  const rows = [
    ...ex.vocab.map((v) => ({
      kind: "vocab" as const,
      ref: v,
      label: `${v.lemma}${v.plural ? `, ${v.plural}` : ""} — ${v.translation_pt}${v.inferred ? "  (article/plural inferred)" : ""}`,
      confidence: v.confidence,
    })),
    ...ex.grammar_points.map((g) => ({
      kind: "grammar" as const,
      ref: g,
      label: `⟨grammar⟩ ${g.name} — ${g.summary}`,
      confidence: 1,
    })),
  ].sort((a, b) => a.confidence - b.confidence); // low-confidence first

  rows.forEach((r, i) => {
    const flag = r.confidence < 0.7 ? " ⚠️" : "";
    console.log(`  ${String(i + 1).padStart(2)}. ${r.label}${flag}`);
  });

  const answer = await rl.question("\ndrop any? (numbers, comma-separated — enter to keep all): ");
  const drop = new Set(
    answer
      .split(",")
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((n) => !isNaN(n)),
  );
  const kept = rows.filter((_, i) => !drop.has(i));
  return {
    themes: ex.themes,
    vocab: kept.filter((r) => r.kind === "vocab").map((r) => r.ref) as Extraction["vocab"],
    grammar_points: kept.filter((r) => r.kind === "grammar").map((r) => r.ref) as Extraction["grammar_points"],
  };
}

// ── the commute ──────────────────────────────────────────────────────────────

async function session(args: string[]) {
  const mIdx = args.indexOf("--minutes");
  const minutes = mIdx > -1 ? parseInt(args[mIdx + 1], 10) : 10;
  const bank = loadBank();
  const slots = assembleSession(bank, minutes);
  if (slots.length === 0) {
    console.log("nothing in the bank yet — run `pendeln ingest` first.");
    return;
  }

  console.log(`\n${minutes}-minute session · ${slots.length} exercises · offline\n`);
  let correct = 0;

  for (let i = 0; i < slots.length; i++) {
    const { item, exercise: ex } = slots[i];
    const station = "○".repeat(i) + "●" + "○".repeat(slots.length - i - 1);
    console.log(`\n${station}\n`);

    let got: boolean;
    if (ex.type === "recall" || ex.type === "scramble") {
      const shown =
        ex.type === "scramble"
          ? [...ex.prompt.split(/\s+/)].sort(() => Math.random() - 0.5).join(" · ")
          : ex.prompt;
      console.log(`  ${shown}`);
      await rl.question("  (think, then enter to reveal) ");
      console.log(`  → ${ex.answer}`);
      got = (await rl.question("  got it? [y/n] ")).trim().toLowerCase().startsWith("y");
    } else {
      console.log(`  ${ex.prompt}`);
      const options = [...ex.distractors, ex.answer].sort(() => Math.random() - 0.5);
      options.forEach((o, k) => console.log(`    ${k + 1}) ${o}`));
      const pick = parseInt(await rl.question("  > "), 10) - 1;
      got = options[pick] === ex.answer;
      console.log(got ? "  ✓" : `  ✗ ${ex.explanation}`);
    }

    item.srs = srsReview(item.srs, got ? 2 : 0);
    item.recentFails = got ? Math.max(0, item.recentFails - 1) : item.recentFails + 1;
    if (got) correct++;
  }

  saveBank(bank);
  const slipping = slots.filter((s) => s.item.recentFails >= 2).map((s) => s.item.id.split(":")[1]);
  console.log(`\ndone — ${correct}/${slots.length}. Session ends. The app stops offering things.`);
  if (slipping.length) console.log(`still slipping: ${[...new Set(slipping)].join(", ")} — worth asking your teacher.`);
}

// ── the honest numbers ───────────────────────────────────────────────────────

function stats() {
  const bank = loadBank();
  const week = bank.weeks.at(-1);
  if (!week) {
    console.log("empty bank. Sunday awaits.");
    return;
  }
  const thisWeek = bank.items.filter((i) => i.week === week.label);
  const practiced = thisWeek.filter((i) => i.srs.reps > 0 || i.recentFails > 0).length;
  const readiness = thisWeek.length ? Math.round((practiced / thisWeek.length) * 100) : 0;
  const due = bank.items.filter((i) => isDue(i.srs)).length;
  const weak = bank.items.filter((i) => i.recentFails >= 2);

  console.log(`\n${week.label} · ${week.themes.join(", ")}`);
  console.log(`class readiness: ${readiness}%  (${practiced}/${thisWeek.length} of this week's material practiced)`);
  console.log(`due for review:  ${due} items across ${bank.weeks.length} weeks`);
  if (weak.length) console.log(`weak spots:      ${weak.map((w) => w.id.split(":")[1]).join(", ")}`);
  console.log(`streaks tracked: 0 (and it will stay that way)\n`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
