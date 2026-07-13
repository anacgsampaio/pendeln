import { spawn } from "node:child_process";
import { z } from "zod/v4";

/**
 * LLM backend: headless Claude Code (`claude -p`) instead of the Anthropic SDK.
 * Runs on the user's Claude subscription — no separate API key or billing.
 * The serverless path (doc 07) will need an SDK backend with a real key; this
 * module is the seam where that swap happens.
 */

export const MODEL = process.env.PENDELN_MODEL ?? "opus";

interface CallOptions {
  /** File the model should read as source material (text, pdf, or image). */
  filePath?: string;
}

async function runClaude(prompt: string, opts: CallOptions): Promise<string> {
  const args = ["-p", "--output-format", "json", "--model", MODEL];
  if (opts.filePath) args.push("--allowedTools", "Read");

  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn("claude", args, {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10 * 60 * 1000,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(out) : reject(new Error(`claude -p exited ${code}: ${err || out}`)),
    );
    child.stdin.end(prompt);
  });

  const envelope = JSON.parse(stdout);
  if (envelope.is_error) throw new Error(`claude -p failed: ${envelope.result}`);
  return envelope.result as string;
}

/** Pull the JSON payload out of a response that may wrap it in prose or fences. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

/**
 * Structured call: prompt + zod schema → validated object.
 * One retry with the validation error fed back before giving up.
 */
export async function structuredCall<S extends z.ZodType>(
  schema: S,
  taskPrompt: string,
  opts: CallOptions = {},
): Promise<z.infer<S>> {
  const jsonSchema = JSON.stringify(z.toJSONSchema(schema));
  const filePreamble = opts.filePath
    ? `First, read the source material at this path using the Read tool: ${opts.filePath}\n` +
      `If it is a PDF with more than 10 pages, read it in page ranges until you have seen every page.\n\n`
    : "";
  const basePrompt =
    `${filePreamble}${taskPrompt}\n\n` +
    `Respond with ONLY a JSON object (no prose, no markdown fences) that validates against this JSON Schema:\n${jsonSchema}`;

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? basePrompt
        : `${basePrompt}\n\nYour previous response failed validation with: ${lastError}\nFix it and respond with only the corrected JSON.`;
    const raw = await runClaude(prompt, opts);
    try {
      return schema.parse(JSON.parse(extractJson(raw)));
    } catch (err) {
      lastError = err instanceof Error ? err.message.slice(0, 2000) : String(err);
    }
  }
  throw new Error(`structured call failed after retry: ${lastError}`);
}
