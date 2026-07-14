import { loadBank, saveBank } from "../src/bank.ts";
import { generateExercises } from "../src/generate.ts";

/**
 * Regenerate exercises for existing bank items (e.g. after a generation-prompt
 * change) without touching items or their SRS state. Saves after every chunk
 * so an interrupted run keeps its progress.
 *
 *   npx tsx scripts/regenerate-exercises.ts [--only-missing]
 */

const onlyMissing = process.argv.includes("--only-missing");

const bank = loadBank();
const targets = bank.items.filter(
  (i) => i.kind !== "dialog" && (onlyMissing ? i.exercises.length === 0 : true),
);
console.log(`regenerating exercises for ${targets.length}/${bank.items.length} items`);

const CHUNK = 24; // 3 LLM batches per save
for (let i = 0; i < targets.length; i += CHUNK) {
  const chunk = targets.slice(i, i + CHUNK);
  const byItem = await generateExercises(chunk);
  for (const item of chunk) {
    const fresh = byItem.get(item.id);
    if (fresh && fresh.length > 0) {
      item.exercises = fresh;
    } else {
      console.log(`  ! kept old exercises for ${item.id} (generation came back empty)`);
    }
  }
  saveBank(bank);
  console.log(`progress: ${Math.min(i + CHUNK, targets.length)}/${targets.length} items`);
}
console.log("done");
