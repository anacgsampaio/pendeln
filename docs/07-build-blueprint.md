# 07 — Build Blueprint (how pendeln works, fully)

*Doc 04 explains the pipeline conceptually. This doc is the "and here is exactly how the whole system runs" companion — written when the first working code landed in [`pipeline/`](../pipeline/). If docs 01–06 are the why, this is the wiring diagram.*

## The system, end to end

pendeln is two programs sharing one contract (the exercise JSON schema):

```
┌─────────────────────────── SUNDAY (online, ~2 min) ───────────────────────────┐
│                                                                                │
│  course material (PDF / photo / notes)                                        │
│        │  pendeln ingest woche-12.pdf --week "Woche 12"                       │
│        ▼                                                                       │
│  EXTRACTION — Claude API, structured outputs (zod schema, validated)          │
│        ▼                                                                       │
│  REVIEW — checklist in the terminal (later: the Einwurf screen)               │
│        ▼                                                                       │
│  GENERATION — Claude API, one exercise set per approved item                  │
│        │  every exercise passes hard validation or gets silently dropped      │
│        ▼                                                                       │
│  ITEM BANK — bank.json (app: SQLite) · items + exercises + SRS state          │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── WEEKDAYS (offline, 10–15 min) ─────────────────────┐
│                                                                                │
│  SESSION ASSEMBLER — deterministic, no LLM, no network                        │
│    50% newest week · 35% SRS-due · 15% weak spots                             │
│    packed to target minutes, warm-up first, winnable last                     │
│        ▼                                                                       │
│  🚃 session player renders exercise JSON dumbly                               │
│        ▼                                                                       │
│  every answer → SM-2 update + weak-spot tags → next session gets smarter      │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

Two LLM calls per week, both on Sunday. Nothing generative ever happens on the train.

## Phase 1 — the pipeline CLI (built, lives in `pipeline/`)

The CLI is the whole product minus the UI. It exists to answer the only question that matters before building an app: **can the pipeline turn my real course material into exercises I'd actually want to do?**

```bash
cd pipeline && npm install
export ANTHROPIC_API_KEY=...        # or `ant auth login`

# Sunday ritual
npx pendeln ingest fixtures/woche-12-notes.md --week "Woche 12"
#   → extracts, opens the review checklist, generates, commits to bank.json

# Commute (works offline once the bank exists)
npx pendeln session --minutes 10
#   → prints an interactive session; answers update SRS state

npx pendeln stats                    # class readiness, due counts, weak spots
```

Accepted inputs: `.txt` / `.md` (pasted notes), `.pdf` (course slides — sent as a document block, Claude reads it directly), `.jpg` / `.png` (whiteboard photos — vision does the OCR). No preprocessing step to maintain; the model is the OCR.

### Design decisions that carry into the app

| Decision | Why |
|---|---|
| **Structured outputs (zod schema) for both LLM stages** | The schema *is* the API. Validation happens at the API layer, so a malformed extraction is a retry, not a corrupt bank. |
| **Model: `claude-opus-4-8`** (env-overridable via `PENDELN_MODEL`) | ~2 calls/week — even the strongest model costs pennies at this volume, and extraction quality is the whole product. |
| **Hard validation after generation** | `answer` must fit the prompt, distractors ≠ answer, cloze must contain the gap. Invalid → regenerate once → drop silently. A missing exercise is invisible; a broken one destroys trust. |
| **JSON file bank in the CLI, SQLite in the app** | Same shape, swappable store. Bonus: R10 (all data exportable as JSON) is satisfied by construction. |
| **Assembler is plain TypeScript, zero I/O** | It must run on-device, offline, instantly. If it needs the network, the product premise dies in the first tunnel. |
| **Dedup-and-boost** | Re-ingesting "die Umwelt" doesn't duplicate it — it bumps SRS priority. The teacher repeating a word is a signal. |

### What the CLI deliberately doesn't do

No accounts, no sync, no TTS, no notifications. Doc 02's Later list stays later. The Wednesday question applies to the CLI too.

## Phase 1b — the Expo app (next)

Once 2–3 real weeks of course material survive the pipeline with an edit rate under ~15%:

- **Stack:** React Native + Expo · expo-sqlite · the same `schema.ts` (shared package) · session player renders the same JSON the CLI produces today.
- **Screens in build order:** Session player (90% of time-in-app) → Heute → Einwurf/review → Bibliothek → Ich. Design direction already explored in [`design/`](../design/) — transit-line progress, one signal accent.
- **The pipeline runs where?** v1: a tiny serverless function (the phone shouldn't hold the API key); the phone uploads material, gets exercise JSON back, stores it in SQLite. The CLI and the function share `src/extract.ts` + `src/generate.ts` verbatim.
- **Offline:** sessions pre-assemble after each ingest and overnight. SQLite is the source of truth for SRS state; nothing round-trips to a server during play.

## Phase 2 — dogfood (8 weeks, one real course term)

Instrument locally, measure against the PRD table in doc 05. The metrics that decide everything:
weekly upload ritual ≥ 7/8 · class readiness ≥ 80% · extraction edit rate < 15% · guilt notifications sent = 0 (forever).

## Open questions inherited from doc 05 — now with positions

1. Session length: **fixed 5/10/15** shipped in the CLI; a slider is a settings screen away if it ever hurts.
2. Grammar points as SRS items: **yes** — the bank treats them as items with their own exercises.
3. Translation direction: **both PT and EN stored**, player shows PT first (Ana thinks in both, sorts in Portuguese).
4. Pipeline trigger: **CLI now, serverless for the app** (decided above).
5. Name check: still pending. pendeln bleibt pendeln until the App Store says otherwise. 🚃
