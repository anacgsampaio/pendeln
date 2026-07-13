import path from "node:path";
import { ExtractionSchema, type Extraction } from "./schema.ts";
import { structuredCall, MODEL } from "./llm.ts";

export { MODEL };

const EXTRACTION_PROMPT = `You are the extraction stage of pendeln, a personal German learning app.
The source material is one week of a real German course (slides, notes, or a whiteboard photo).
The learner is a Portuguese native speaker, also fluent in English, studying German (roughly A2–B1).

Extract, faithfully to THIS material (not a generic curriculum):
- themes: 1-4 short topic labels
- grammar_points: every grammar structure the class covered, with a one-line summary and, when possible, an example sentence taken from the material itself
- vocab: the vocabulary actually taught. Nouns MUST carry article and plural — if the material doesn't show them, fill them in from your knowledge of German and set inferred=true. Prefer example sentences from the material over invented ones. Set confidence honestly; below 0.7 means "a human should look at this".

Do not invent vocabulary the material doesn't contain. Teacher names, page numbers and admin notes are not vocabulary.`;

export async function extractFromFile(filePath: string): Promise<Extraction> {
  return structuredCall(ExtractionSchema, EXTRACTION_PROMPT, {
    filePath: path.resolve(filePath),
  });
}
