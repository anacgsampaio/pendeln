# 04 — Content Pipeline

*This is the heart of the product. Everything else is a nice UI around this pipeline.*

## The flow, end to end

```
[Class material]                    [User]                     [App]
 PDF / photo / notes  ──upload──▶  labels it ("Woche 12")
                                        │
                                        ▼
                              ┌── EXTRACTION (LLM) ──┐
                              │ vocab, grammar,      │
                              │ themes, sentences    │
                              └──────────┬───────────┘
                                         ▼
                              REVIEW CHECKPOINT (human, <60s)
                              approve / edit / delete items
                                         ▼
                              ┌── GENERATION (LLM) ──┐
                              │ exercise JSON per     │
                              │ item, all types       │
                              └──────────┬───────────┘
                                         ▼
                              ITEM BANK (SQLite)
                              items + exercises + SRS state
                                         ▼
                              SESSION ASSEMBLER (no LLM — deterministic)
                              new material + due reviews + weak spots
                              packed to target minutes, cached offline
                                         ▼
                                 🚃 commute session
```

Two LLM stages, both at *ingestion time*. Nothing generative happens during a session — sessions must be instant, offline, and cheap.

## Stage 1 — Extraction

**Input:** raw material (PDF text, OCR'd photo, pasted notes) + context (course level, language pair, previous weeks' themes for continuity).

**Output (structured):**

```json
{
  "week_label": "Woche 12",
  "themes": ["Umwelt", "Hypotheticals"],
  "grammar_points": [
    {
      "id": "gp_konjunktiv2",
      "name": "Konjunktiv II",
      "summary": "würde + infinitive; hätte/wäre for haben/sein",
      "example_from_material": "Ich würde gern mehr reisen."
    }
  ],
  "vocab": [
    {
      "lemma": "die Umwelt",
      "article": "die",
      "plural": null,
      "pos": "noun",
      "translation_pt": "o meio ambiente",
      "translation_en": "the environment",
      "example_from_material": "Wir müssen die Umwelt schützen.",
      "confidence": 0.95
    }
  ]
}
```

**Rules that matter:**
- Nouns ALWAYS carry article + plural. If the material didn't show them, the model fills them in and flags `inferred: true` (shown differently in review).
- `example_from_material` preferred over invented examples — the whole point is that this sounds like *her class*, not like a textbook nobody has.
- Low-confidence extractions (< 0.7) sort to the top of the review screen.
- Dedup against the existing item bank: "die Umwelt" seen in Woche 8 → don't re-add, but *boost* its SRS priority (the teacher repeating it is a signal).

## Stage 2 — Review checkpoint

Non-negotiable human-in-the-loop moment. UI is a checklist: each item is a row, tap to toggle off, long-press to edit. Target: under 60 seconds for a normal week. This checkpoint is what keeps lesson quality high without a content team — the user IS the content team, for 60 seconds a week.

## Stage 3 — Exercise generation

For each approved item, generate a small set of exercises across types (cloze, recall, scramble, MC-grammar). Output conforms to the **exercise schema** — the product's real API:

```json
{
  "exercise_id": "ex_8f3a",
  "item_ref": "vocab:die Umwelt",
  "type": "cloze",
  "difficulty": 2,
  "prompt": "Wir müssen ___ Umwelt schützen.",
  "answer": "die",
  "distractors": ["der", "das", "den"],
  "explanation": "Umwelt is feminine; accusative feminine keeps 'die'.",
  "audio_ref": null,
  "source_week": "Woche 12"
}
```

- The client is a dumb renderer of this schema. New exercise types = new `type` value + one new renderer component. This is what keeps the app extensible.
- Generation is validated: schema check, answer-actually-in-prompt check, distractors ≠ answer. Invalid → regenerate once → else drop silently (never ship a broken exercise; a missing one is invisible, a wrong one destroys trust).

## Session assembler (deterministic, on-device)

Given target minutes (each exercise type has a seconds-cost estimate):
1. **~50%** exercises from the newest week (breadth-first: touch every new item once before repeating any)
2. **~35%** SRS-due items from the whole bank (SM-2 style scheduling)
3. **~15%** weak spots (highest recent-failure items), capped so a bad week doesn't become a punishment session
4. Shuffle with constraints: never two exercises on the same item back-to-back; open with something easy (train-boarding warm-up), end on something winnable (leave on a high note).

Sessions pre-build overnight and after each upload → always available offline.

## Feedback loop (what makes it get better)

Every answer writes back: item result → SRS state; wrong-answer *pattern* → weak-spot tags (e.g., consistently failing dative endings across items ≠ failing 5 random words — the assembler should know the difference). Weekly recap surfaces the pattern in human words: "cases are your thing this month, not vocabulary."

## Costs & failure modes (be honest early)

- **LLM cost:** ~2 calls/week/user at ingestion. Pennies. This is why generation-at-ingestion beats generation-at-quiz-time.
- **OCR of whiteboard photos** will be the flakiest input. Mitigation: review checkpoint + "photo tips" microcopy. Don't over-engineer before feeling the real failure rate.
- **Bad extraction week 1 = churn forever.** The onboarding upload must be the most hand-held flow in the app.
- **Copyright:** ingested textbook content stays private to the user, is never redistributed, and exercises transform rather than reproduce. Fine for personal use; revisit hard before any "share with classmates" feature ships.
