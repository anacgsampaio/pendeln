import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ExtractionSchema, type Extraction } from "./schema.ts";
import { fileToContentBlock } from "./content.ts";

export const MODEL = process.env.PENDELN_MODEL ?? "claude-opus-4-8";

const client = new Anthropic();

const EXTRACTION_PROMPT = `You are the extraction stage of pendeln, a personal German learning app.
The attached material is one week of a real German course (slides, notes, or a whiteboard photo).
The learner is a Portuguese native speaker, also fluent in English, studying German (roughly A2–B1).

Extract, faithfully to THIS material (not a generic curriculum):
- themes: 1-4 short topic labels
- grammar_points: every grammar structure the class covered, with a one-line summary and, when possible, an example sentence taken from the material itself
- vocab: the vocabulary actually taught. Nouns MUST carry article and plural — if the material doesn't show them, fill them in from your knowledge of German and set inferred=true. Prefer example sentences from the material over invented ones. Set confidence honestly; below 0.7 means "a human should look at this".

Do not invent vocabulary the material doesn't contain. Teacher names, page numbers and admin notes are not vocabulary.`;

export async function extractFromFile(filePath: string): Promise<Extraction> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: [fileToContentBlock(filePath), { type: "text", text: EXTRACTION_PROMPT }],
      },
    ],
    output_config: { format: zodOutputFormat(ExtractionSchema) },
  });
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("extraction returned no parseable output");
  return parsed;
}
