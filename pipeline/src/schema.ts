import { z } from "zod";

/**
 * The exercise JSON schema is the real API of this product (doc 04).
 * The pipeline writes it; every client (CLI today, Expo app later) renders it dumbly.
 */

export const GrammarPointSchema = z.object({
  id: z.string().describe("stable slug, e.g. gp_konjunktiv2"),
  name: z.string(),
  summary: z.string().describe("one-line rule summary a tired commuter can absorb"),
  example_from_material: z
    .string()
    .nullable()
    .describe("a sentence lifted from the class material, if one exists"),
});

export const VocabItemSchema = z.object({
  lemma: z.string().describe("dictionary form; nouns include the article, e.g. 'die Umwelt'"),
  article: z.enum(["der", "die", "das"]).nullable().describe("null for non-nouns"),
  plural: z.string().nullable(),
  pos: z.enum(["noun", "verb", "adjective", "adverb", "preposition", "conjunction", "phrase", "other"]),
  translation_pt: z.string(),
  translation_en: z.string(),
  example_from_material: z.string().nullable(),
  inferred: z
    .boolean()
    .describe("true if article/plural were filled in by the model rather than present in the material"),
  confidence: z.number().describe("0..1 — extractions below 0.7 sort to the top of review"),
});

export const ExtractionSchema = z.object({
  themes: z.array(z.string()),
  grammar_points: z.array(GrammarPointSchema),
  vocab: z.array(VocabItemSchema),
});
export type Extraction = z.infer<typeof ExtractionSchema>;
export type VocabItem = z.infer<typeof VocabItemSchema>;
export type GrammarPoint = z.infer<typeof GrammarPointSchema>;

export const ExerciseSchema = z.object({
  item_ref: z.string().describe("must exactly match the item id it was generated for"),
  type: z.enum(["cloze", "recall", "scramble", "mc_grammar"]),
  difficulty: z.number().describe("1 (warm-up) to 3 (boss fight)"),
  prompt: z
    .string()
    .describe("cloze: sentence with ___ gap · recall: front of card · scramble: the words in correct order, space-separated · mc_grammar: the question"),
  answer: z.string(),
  distractors: z.array(z.string()).describe("wrong options for cloze/mc_grammar; empty for recall/scramble"),
  explanation: z.string().describe("one compact line: the correction and why"),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const ExerciseBatchSchema = z.object({
  exercises: z.array(ExerciseSchema),
});

/** Hard validation — a broken exercise destroys trust; a missing one is invisible. */
export function validateExercise(ex: Exercise, knownItemIds: Set<string>): string | null {
  if (!knownItemIds.has(ex.item_ref)) return `unknown item_ref ${ex.item_ref}`;
  if (ex.type === "cloze" && !ex.prompt.includes("___")) return "cloze without a ___ gap";
  if (ex.type === "cloze" && ex.prompt.includes(ex.answer)) return "cloze leaks its answer";
  if ((ex.type === "cloze" || ex.type === "mc_grammar") && ex.distractors.length < 2)
    return "needs at least 2 distractors";
  if (ex.distractors.some((d) => d.trim().toLowerCase() === ex.answer.trim().toLowerCase()))
    return "a distractor equals the answer";
  if (ex.type === "scramble" && ex.prompt.trim().split(/\s+/).length < 3)
    return "scramble too short to scramble";
  return null;
}
