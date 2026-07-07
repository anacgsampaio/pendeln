import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ExerciseBatchSchema, validateExercise, type Exercise } from "./schema.ts";
import type { BankItem } from "./bank.ts";
import { MODEL } from "./extract.ts";

const client = new Anthropic();

const GENERATION_PROMPT = `You are the exercise-generation stage of pendeln, a personal German learning app used on a commute: one thumb, standing up, no audio, no typing.

For EACH item below, produce 2-4 exercises across the types cloze, recall, scramble, mc_grammar:
- cloze: a real sentence with the answer replaced by ___ . Prefer sentences from the item's example_from_material — the point is that this sounds like the learner's class, not a textbook. 2-3 plausible distractors.
- recall: prompt is the German side ("die Umwelt"), answer is the Portuguese translation. For nouns, also make one article drill (prompt: "___ Umwelt", answer: "die", distractors: the other two articles).
- scramble: prompt is a full correct German sentence (the client scrambles it), answer identical to prompt. Word order is the eternal German boss fight — use subordinate clauses when a grammar item calls for it.
- mc_grammar: for grammar items — pick the right form/case/ending, 3 distractors.

Rules: item_ref must exactly equal the item's id. Distractors must be genuinely plausible errors a Portuguese speaker makes. Explanations are ONE compact line. difficulty 1 = seen it before warm-up, 3 = full production.`;

function describeItem(item: BankItem): string {
  if (item.kind === "vocab" && item.vocab) {
    const v = item.vocab;
    return `id: ${item.id}\n  lemma: ${v.lemma} · plural: ${v.plural ?? "—"} · pos: ${v.pos}\n  pt: ${v.translation_pt} · en: ${v.translation_en}\n  example_from_material: ${v.example_from_material ?? "—"}`;
  }
  const g = item.grammar!;
  return `id: ${item.id}\n  grammar point: ${g.name} — ${g.summary}\n  example_from_material: ${g.example_from_material ?? "—"}`;
}

async function generateBatch(items: BankItem[]): Promise<Exercise[]> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: `${GENERATION_PROMPT}\n\nITEMS:\n\n${items.map(describeItem).join("\n\n")}`,
      },
    ],
    output_config: { format: zodOutputFormat(ExerciseBatchSchema) },
  });
  return response.parsed_output?.exercises ?? [];
}

/**
 * Generate exercises for items, validate hard, retry invalid ones once,
 * then drop what still fails. Never ship a broken exercise.
 */
export async function generateExercises(items: BankItem[]): Promise<Map<string, Exercise[]>> {
  const ids = new Set(items.map((i) => i.id));
  const byItem = new Map<string, Exercise[]>();
  const BATCH = 8;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    let produced = await generateBatch(batch);
    let rejected = produced.filter((ex) => validateExercise(ex, ids) !== null);
    let accepted = produced.filter((ex) => validateExercise(ex, ids) === null);

    if (rejected.length > 0) {
      // one retry for the items whose exercises came back broken
      const retryIds = new Set(rejected.map((r) => r.item_ref));
      const retryItems = batch.filter((it) => retryIds.has(it.id));
      if (retryItems.length > 0) {
        const retry = await generateBatch(retryItems);
        accepted = accepted.concat(retry.filter((ex) => validateExercise(ex, ids) === null));
      }
    }

    for (const ex of accepted) {
      const list = byItem.get(ex.item_ref) ?? [];
      list.push(ex);
      byItem.set(ex.item_ref, list);
    }
  }
  return byItem;
}
