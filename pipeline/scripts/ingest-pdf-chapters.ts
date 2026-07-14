import path from "node:path";
import { z } from "zod/v4";
import { structuredCall } from "../src/llm.ts";
import { ExtractionSchema } from "../src/schema.ts";
import { generateExercises } from "../src/generate.ts";
import { loadBank, saveBank, mergeWeek } from "../src/bank.ts";

/**
 * Headless ingest of a large reference PDF, one chapter per pseudo-week.
 * Auto-approves the review step — meant for seeding the bank from trusted
 * material, not for the weekly ritual (which keeps its human checkpoint).
 *
 *   npx tsx scripts/ingest-pdf-chapters.ts <file.pdf> [chapterNumbers...]
 */

const [file, ...chapterArgs] = process.argv.slice(2);
if (!file) throw new Error("usage: ingest-pdf-chapters.ts <file.pdf> [chapterNumbers...]");
const pdf = path.resolve(file);

const TocSchema = z.object({
  chapters: z.array(z.object({ n: z.number(), title: z.string(), pages: z.string() })),
});

console.log("mapping chapters …");
const toc = await structuredCall(
  TocSchema,
  "List the top-level numbered chapters/sections of this document with their page ranges (e.g. pages: \"4-5\").",
  { filePath: pdf },
);
console.log(toc.chapters.map((c) => `  ${c.n}. ${c.title} (p. ${c.pages})`).join("\n"));

const wanted = chapterArgs.length > 0 ? new Set(chapterArgs.map(Number)) : null;
const chapters = toc.chapters.filter((c) => !wanted || wanted.has(c.n));

const EXTRACTION_PROMPT = `You are the extraction stage of pendeln, a personal German learning app.
The learner is an English speaker studying German (A1).

From the document, extract ONLY the content of chapter CHAPTER_SPEC — ignore every other chapter.

Extract, faithfully to THIS material (not a generic curriculum):
- themes: 1-4 short topic labels
- grammar_points: every grammar structure the chapter covers, with a one-line summary and, when possible, an example sentence taken from the material itself
- vocab: the vocabulary actually taught in this chapter. Nouns MUST carry article and plural — if the material doesn't show them, fill them in from your knowledge of German and set inferred=true. Prefer example sentences from the material over invented ones. Set confidence honestly; below 0.7 means "a human should look at this".

Do not invent vocabulary the material doesn't contain. Page numbers, color-key legends and how-to-use notes are not vocabulary.`;

for (const ch of chapters) {
  const week = `A1 Kapitel ${ch.n} — ${ch.title}`;
  console.log(`\n── ${week} (p. ${ch.pages}) ──`);
  const extraction = await structuredCall(
    ExtractionSchema,
    EXTRACTION_PROMPT.replace("CHAPTER_SPEC", `${ch.n} ("${ch.title}", pages ${ch.pages})`),
    { filePath: pdf },
  );
  console.log(`  extracted: ${extraction.vocab.length} vocab · ${extraction.grammar_points.length} grammar · themes: ${extraction.themes.join(", ")}`);

  const bank = loadBank();
  const fresh = mergeWeek(bank, week, extraction.themes, extraction.vocab, extraction.grammar_points);
  console.log(`  ${fresh.length} new items · ${extraction.vocab.length + extraction.grammar_points.length - fresh.length} boosted`);

  if (fresh.length > 0) {
    console.log("  generating exercises …");
    const byItem = await generateExercises(fresh);
    let total = 0;
    for (const item of fresh) {
      item.exercises = byItem.get(item.id) ?? [];
      total += item.exercises.length;
    }
    console.log(`  ${total} exercises passed validation.`);
  }
  saveBank(bank);
  console.log(`  ✓ committed`);
}
