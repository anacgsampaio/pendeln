# pipeline/ 🚃

The phase-1 CLI — the whole product minus the UI. It answers the only question worth answering before building an app: **can this pipeline turn my real course material into exercises I'd actually want to do on the U8 at 8am?**

## Run it

```bash
npm install
# no API key needed — the pipeline shells out to `claude -p` (headless Claude Code),
# which runs on your Claude subscription. Just be logged in to Claude Code.

# Sunday (online, ~2 min): extract → 60-second review checklist → generate → bank.json
npm run pendeln -- ingest fixtures/woche-12-notes.md --week "Woche 12"

# Weekdays (offline): play a commute-sized session, SRS updates as you answer
npm run pendeln -- session --minutes 10

# The honest numbers (no streaks — class readiness)
npm run pendeln -- stats
```

Inputs: `.md`/`.txt` notes, `.pdf` course slides, `.jpg`/`.png` whiteboard photos — PDFs and photos go straight to the model as documents/images; there is no separate OCR step to babysit.

## Map

| file | does |
|---|---|
| `src/schema.ts` | the exercise JSON schema — the real API of the product — plus the hard validators |
| `src/llm.ts` | the LLM seam: headless `claude -p` + zod validation (subscription, no API key) |
| `src/extract.ts` | stage 1: material → structured vocab/grammar (Claude, structured outputs) |
| `src/generate.ts` | stage 3: approved items → exercises, validate-or-drop, one retry |
| `src/bank.ts` | item bank + dedup-and-boost (`bank.json` here; SQLite in the app) |
| `src/srs.ts` | dumb SM-2, on purpose |
| `src/assemble.ts` | deterministic session assembler — 50/35/15, offline, no LLM |
| `src/cli.ts` | ingest / session / stats + the review checkpoint |

Config: `PENDELN_MODEL` (default `opus` — two calls a week, quality over pennies), `PENDELN_BANK` (default `./bank.json`). A `pipeline/.env` file is loaded automatically if present.

Full wiring diagram and app plan: [docs/07-build-blueprint.md](../docs/07-build-blueprint.md).
